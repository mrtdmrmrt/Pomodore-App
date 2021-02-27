import {
  getDataFromApi,
  addTaskToApi,
  deleteTaskToApi,
  completeTaskOnApi,
} from './data';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from './constans';
import { getNow, addMinutesToDate, getRemainingDate } from './helpers/date';

class PomodoroApp {
  constructor(options) {
    let {
      tableTbodySelector,
      taskFormSelector,
      startBtnSelector,
      timerElSelector,
      pauseBtnSelector,
    } = options;
    this.data = [];
    this.$tableTbody = document.querySelector(tableTbodySelector);
    this.$taskForm = document.querySelector(taskFormSelector);
    this.$taskFormInput = this.$taskForm.querySelector('input');
    this.$taskFormBtn = this.$taskForm.querySelector('button');

    this.$startBtn = document.querySelector(startBtnSelector);
    this.$pauseBtn = document.querySelector(pauseBtnSelector);
    this.$timerEl = document.querySelector(timerElSelector);
    this.currentInterval = null;
    this.breakInterval = null;
    this.currentRemaining = null;
    this.currentTask = null;
  }

  addTask(task) {
    addTaskToApi(task)
      .then((data) => data.json())
      .then((newTask) => {
        this.addTaskToTable(newTask);
      });
  }

  addTaskToTable(task, index) {
    const $newTaskEl = document.createElement('tr');
    $newTaskEl.innerHTML = `<th scope="row">${task.id}</th><td>${task.title}</td>`;
    $newTaskEl.setAttribute('data-taskId', `task${task.id}`);
    if (task.completed) {
      $newTaskEl.classList.add('completed');
    }
    this.$tableTbody.appendChild($newTaskEl);
    this.$taskFormInput.value = '';
  }

  handleAddTask() {
    this.$taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { title: this.$taskFormInput.value, completed: false };
      if (this.$taskFormInput.value) this.addTask(task);
    });
  }

  fillTasksTable() {
    getDataFromApi().then((currentTasks) => {
      this.data = currentTasks;
      currentTasks.forEach((task, index) => {
        this.addTaskToTable(task, index + 1);
      });
      this.fillDeleteTask();
    });
  }

  fillDeleteTask() {
    const $deleteBtn = document.querySelectorAll('.btn-delete');
    $deleteBtn.forEach((element) => {
      console.log('element=>', element);
      element.addEventListener('click', (e) => {
        deleteTaskToApi(element.id).then((res) => {
          if (res.status == '200') {
            const $newTaskEl = this.$tableTbody.querySelectorAll('tr');
            $newTaskEl.forEach((tr) => {
              tr.remove();
            });
            this.fillTasksTable();
          }
        });
      });
    });
  }
  setActiveTask() {
    const $currentActiveEl = document.querySelector('tr.active');
    if ($currentActiveEl) {
      $currentActiveEl.classList.remove('active');
      $currentActiveEl.classList.add('completed');
    }
    this.currentTask = this.data.find((task) => !task.completed);
    console.log(this.data);
    if (this.currentTask) {
      const $currentTaskEl = document.querySelector(
        `tr[data-taskId = 'task${this.currentTask.id}']`
      );
      $currentTaskEl.classList.add('active');
      const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK_TIME);
      this.createNewTimer(newDeadline);
    } else {
      clearInterval(this.currentInterval);
      clearInterval(this.breakInterval);
      this.$timerEl.innerHTML = 'All tasks are done';
    }
  }
  initializeBreakTimer() {
    const now = getNow();
    const breakDeadline = addMinutesToDate(now, POMODORO_BREAK_TIME);
    this.breakInterval = setInterval(() => {
      const remainingBreakTime = getRemainingDate(breakDeadline);
      const { total, minutes, seconds } = remainingBreakTime;
      this.$timerEl.innerHTML = `Chill: ${minutes}:${seconds}`;
      if (total <= 0) {
        clearInterval(this.breakInterval);
        completeTaskOnApi(this.currentTask).then(() => {
          this.currentTask.completed = true;
          this.setActiveTask();
        });
      }
    }, 1000);
  }

  initializeTimer(deadline) {
    this.currentInterval = setInterval(() => {
      const remainingTime = getRemainingDate(deadline);
      const { total, minutes, seconds } = remainingTime;
      this.currentRemaining = total;
      this.$timerEl.innerHTML = `You are working: ${minutes}:${seconds}`;

      if (total <= 0) {
        clearInterval(this.currentInterval);
        this.initializeBreakTimer();
      }
    }, 1000);
  }
  createNewTimer(deadline) {
    this.initializeTimer(deadline);
  }

  handleStart() {
    this.$startBtn.addEventListener('click', () => {
      if (this.currentRemaining) {
        const remainingDeadline = new Date(
          getNow().getTime() + this.currentRemaining
        );
        this.createNewTimer(remainingDeadline);
      } else {
        this.setActiveTask();
      }
    });
  }

  handlePause() {
    this.$pauseBtn.addEventListener('click', () => {
      clearInterval(this.currentInterval);
      console.log(this.currentRemaining);
    });
  }

  init() {
    this.fillTasksTable();
    this.handleAddTask();
    this.handleStart();
    this.handlePause();
  }
}

export default PomodoroApp;
