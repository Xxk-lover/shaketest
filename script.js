// 记录数据用的数组（最后可以导出）
let eventLog = [];
let adTriggerTime = null;
let shakeThreshold = 12; // 阈值，单位 m/s²，需要你实测校准

// 获取页面元素
const startBtn = document.getElementById('startBtn');
const checkinBtn = document.getElementById('checkinBtn');
const adOverlay = document.getElementById('adOverlay');
const backBtn = document.getElementById('backBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const statusEl = document.getElementById('status');

// 点击“开始任务”
startBtn.addEventListener('click', async () => {
  // iOS 必须请求传感器权限
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') {
        statusEl.textContent = '传感器权限被拒绝，实验无法继续';
        return;
      }
    } catch (e) {
      statusEl.textContent = '权限请求失败：' + e.message;
      return;
    }
  }

  // 开始监听摇晃
  window.addEventListener('devicemotion', handleMotion);
  startBtn.style.display = 'none';
  checkinBtn.style.display = 'inline-block';
  statusEl.textContent = '任务进行中，请正常使用手机…';
  logEvent('task_started');
});

// 摇晃检测
let lastShakeTime = 0;
function handleMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc || acc.x === null) return;

  const magnitude = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
  const now = Date.now();

  // 超过阈值且不在冷却期（1.5秒），触发广告
  if (magnitude > shakeThreshold && now - lastShakeTime > 1500) {
    lastShakeTime = now;
    triggerAd();
  }
}

function triggerAd() {
  adTriggerTime = Date.now();
  adOverlay.style.display = 'block';
  logEvent('ad_triggered');
}

// 广告页的“返回”按钮
backBtn.addEventListener('click', () => {
  const dwell = adTriggerTime ? Date.now() - adTriggerTime : 0;
  logEvent('ad_dismissed', { dwellTimeMs: dwell });
  adOverlay.style.display = 'none';
});

// “了解更多”按钮（转化意愿代理）
learnMoreBtn.addEventListener('click', () => {
  logEvent('learn_more_clicked');
  alert('你点击了了解更多（此处可替换为跳转页面）');
});

// 打卡完成
checkinBtn.addEventListener('click', () => {
  logEvent('task_completed');
  statusEl.textContent = '打卡完成！数据已记录。';
  checkinBtn.disabled = true;
  // 把日志显示出来，方便你收集
  console.log(JSON.stringify(eventLog, null, 2));
});

// 记录事件
function logEvent(type, extra = {}) {
  eventLog.push({
    type: type,
    timestamp: Date.now(),
    ...extra
  });
}