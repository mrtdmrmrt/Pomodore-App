import {
  getDataFromApi,
  addTaskToApi,
  deleteTaskToApi,
  completeTaskOnApi,
} from './data';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from './constans';
import { getNow, addMinutesToDate, getRemainingDate } from './helpers/date';
import { createTimer } from './helpers/timer';

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
    $newTaskEl.innerHTML = `<th scope="row">${task.id}</th><td>${task.title}</td> <td><button id='${task.id}' class="btn-delete"><i class="fa fa-trash"></i></button></td>`;
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
      this.addTask(task);
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
    this.handlePreviousTask();
    this.currentTask = this.data.find((task) => !task.completed);
    if (this.currentTask) {
      this.startTask();
    } else {
      this.handleEnd();
    }
    this.currentTask ? this.startTask() : this.handleEnd();
    // ternary ifler deger return eden ve assignment olan durumlarda kullaniliyor
    //const isActive = document.querySelector('#active') ? 'yes' : 'no';
  }
  initializeBreakTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'breakInterval',
      deadline: deadline,
      timerElContent: 'Chill: ',
      onStop: () => {
        completeTaskOnApi(this.currentTask).then(() => {
          this.currentTask.completed = true;
          this.setActiveTask();
        });
      },
    });
  }

  initializeTimer(deadline) {
    createTimer({
      context: this,
      intervalVariable: 'currentInterval',
      deadline,
      timerElContent: "You're working: ",
      onStop: () => {
        const now = getNow();
        const breakDeadline = addMinutesToDate(now, POMODORO_BREAK_TIME);
        this.initializeBreakTimer(breakDeadline);
      },
      currentRemaining: 'currentRemaining',
    });
  }

  handlePreviousTask() {
    const $currentActiveEl = document.querySelector('tr.active');
    if ($currentActiveEl) {
      $currentActiveEl.classList.remove('active');
      $currentActiveEl.classList.add('completed');
    }
  }
  startTask() {
    const $currentTaskEl = document.querySelector(
      `tr[data-taskId = 'task${this.currentTask.id}']`
    );
    $currentTaskEl.classList.add('active');
    const newDeadline = addMinutesToDate(getNow(), POMODORO_WORK_TIME);
    this.initializeTimer(newDeadline);
  }

  handleEnd() {
    clearInterval(this.currentInterval);
    clearInterval(this.breakInterval);
    this.$timerEl.innerHTML = 'All tasks are done';
  }
  createNewTimer(deadline) {
    this.initializeTimer(deadline);
  }

  handleStart() {
    this.$startBtn.addEventListener('click', () => {
      // check if continues to current task or start a new task.
      if (this.currentRemaining) {
        this.continueTask();
      } else {
        this.setActiveTask();
      }
    });
  }
  continueTask() {
    const now = getNow();
    const nowTimestamp = now.getTime();
    const remainingDeadline = new Date(nowTimestamp + this.currentRemaining);
    this.initializeTimer(remainingDeadline);
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
