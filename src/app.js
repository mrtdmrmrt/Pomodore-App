import { getDataFromApi, addTaskToApi, deleteTaskToApi } from './data';
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
  }

  addTask(task) {
    this.$taskFormBtn.textContent = 'Loading...';
    this.$taskFormBtn.disabled = true;
    addTaskToApi(task)
      .then((data) => data.json())
      .then((newTask) => {
        this.addTaskToTable(newTask);
        this.$taskFormBtn.textContent = 'Add Task';
        this.$taskFormBtn.disabled = false;
      });
  }

  addTaskToTable(task, index) {
    const $newTaskEl = document.createElement('tr');
    $newTaskEl.innerHTML = `<th scope="row">${task.id}</th><td>${task.title}</td> <td><button id='${task.id}' class="btn-delete"><i class="fa fa-trash"></i></button></td>`;
    this.$tableTbody.appendChild($newTaskEl);

    this.$taskFormInput.value = '';
  }

  handleAddTask() {
    this.$taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = { title: this.$taskFormInput.value };
      if (this.$taskFormInput.value) this.addTask(task);
    });
  }

  fillTasksTable() {
    getDataFromApi().then((currentTasks) => {
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

  initializeBreakTimer() {
    const now = getNow();
    const breakDeadline = addMinutesToDate(now, POMODORO_BREAK_TIME);
    this.breakInterval = setInterval(() => {
      const remainingBreakTime = getRemainingDate(breakDeadline);
      const { total, minutes, seconds } = remainingBreakTime;
      this.$timerEl.innerHTML = `Chill: ${minutes}:${seconds}`;
      if (total <= 0) {
        clearInterval(this.breakInterval);
        const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK_TIME);
        this.createNewTimer(newDeadline);
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
        const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK_TIME);
        this.createNewTimer(newDeadline);
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
