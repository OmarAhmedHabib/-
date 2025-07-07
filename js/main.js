
// ========== المتغيرات العامة ==========
const apiUrl = 'https://mp3quran.net/api/v3';
const language = 'ar';

let lastVolume = 1;
let isPlaying = false;

// ========== عند تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', () => {
  const chooseReciter = document.getElementById('chooseReciter');
  const chooseMoshaf = document.getElementById('chooseMoshaf');
  const chooseSurah = document.getElementById('chooseSurah');
  const audioPlayer = document.getElementById('audioPlayer');
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  const volumeBar = document.getElementById('volumeBar');
  const volumeToggle = document.getElementById('volumeToggle');
  const progressBar = document.getElementById('progressBar');
  const currentSurahName = document.getElementById('currentSurahName');
  const currentReciterName = document.getElementById('currentReciterName');
  const currentPlaying = document.getElementById('currentPlaying');
  const verseCount = document.getElementById('verseCount');
  const surahType = document.getElementById('surahType');
  const surahNumber = document.getElementById('surahNumber');
  const infoPanel = document.getElementById('infoPanel');
  const closeInfoBtn = document.getElementById('closeInfoBtn');

  // ========== جلب القراء ==========
  async function getReciters() {
    try {
      chooseReciter.innerHTML = '<option disabled selected>--- اختر قارئًا ---</option>';
      const res = await fetch(`${apiUrl}/reciters?language=${language}`);
      const data = await res.json();
      data.reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.id;
        option.textContent = reciter.name;
        chooseReciter.appendChild(option);
      });
      chooseReciter.onchange = () => getMoshaf(chooseReciter.value);
    } catch (error) {
      console.error('Error fetching reciters:', error);
      alert('حدث خطأ أثناء جلب بيانات القراء. حاول لاحقًا.');
    }
  }

  // ========== جلب المصحف ==========
  async function getMoshaf(reciterId) {
    try {
      chooseMoshaf.disabled = false;
      chooseMoshaf.innerHTML = '<option disabled selected>--- اختر مصحفًا ---</option>';
      const res = await fetch(`${apiUrl}/reciters?language=${language}&reciter=${reciterId}`);
      const data = await res.json();
      const moshafs = data.reciters[0].moshaf;

      moshafs.forEach(moshaf => {
        const option = document.createElement('option');
        option.textContent = moshaf.name;
        option.dataset.server = moshaf.server;
        option.dataset.surahList = moshaf.surah_list;
        chooseMoshaf.appendChild(option);
      });

      chooseMoshaf.onchange = () => {
        const selected = chooseMoshaf.selectedOptions[0];
        getSurah(selected.dataset.server, selected.dataset.surahList);
      };

      chooseSurah.disabled = true;
      chooseSurah.innerHTML = '<option disabled selected>--- اختر سورة ---</option>';
    } catch (error) {
      console.error('Error fetching moshafs:', error);
      alert('حدث خطأ أثناء جلب بيانات المصاحف.');
    }
  }

  // ========== جلب السور ==========
  async function getSurah(server, list) {
    try {
      chooseSurah.disabled = false;
      chooseSurah.innerHTML = '<option disabled selected>--- اختر سورة ---</option>';
      const res = await fetch(`${apiUrl}/suwar`);
      const data = await res.json();
      const ids = list.split(',');
      ids.forEach(id => {
        const surah = data.suwar.find(s => s.id == id);
        if (surah) {
          const option = document.createElement('option');
          option.textContent = surah.name;
          option.value = surah.id;
          option.dataset.server = server;
          option.dataset.verses = surah.ayat;
          option.dataset.type = surah.type;
          option.dataset.number = surah.id;
          chooseSurah.appendChild(option);
        }
      });
      chooseSurah.onchange = loadSurah;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      alert('حدث خطأ أثناء جلب السور.');
    }
  }

  // ========== تحميل السورة ==========
  function loadSurah() {
    const selected = chooseSurah.selectedOptions[0];
    const surahId = selected.value;
    const audioUrl = `${selected.dataset.server}${surahId.padStart(3, '0')}.mp3`;

    audioPlayer.src = audioUrl;
    audioPlayer.load();

    currentSurahName.textContent = selected.textContent;
    currentReciterName.textContent = chooseReciter.selectedOptions[0].textContent;
    verseCount.textContent = selected.dataset.verses;
    surahType.textContent = selected.dataset.type;
    surahNumber.textContent = selected.dataset.number;
    currentPlaying.innerHTML = `🔊 <strong>${selected.textContent}</strong> بصوت <strong>${currentReciterName.textContent}</strong>`;
    infoPanel.classList.add('show');

    playBtn.disabled = false;
    stopBtn.disabled = false;

    audioPlayer.addEventListener('canplay', () => playAudio(), { once: true });
  }

  // ========== تشغيل / إيقاف / كتم ==========
  function playAudio() {
    audioPlayer.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i><span>إيقاف مؤقت</span>';
    playBtn.onclick = pauseAudio;
    document.querySelector('.player-container').classList.add('playing');
    document.querySelector('.player-container').classList.remove('paused');
    isPlaying = true;
  }

  function pauseAudio() {
    audioPlayer.pause();
    playBtn.innerHTML = '<i class="fas fa-play"></i><span>تشغيل</span>';
    playBtn.onclick = playAudio;
    document.querySelector('.player-container').classList.remove('playing');
    document.querySelector('.player-container').classList.add('paused');
    isPlaying = false;
  }

  function stopAudio() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    pauseAudio();
  }

  function toggleMute() {
    if (audioPlayer.volume > 0) {
      lastVolume = audioPlayer.volume;
      audioPlayer.volume = 0;
      volumeBar.value = 0;
      updateVolumeIcon(0);
    } else {
      audioPlayer.volume = lastVolume;
      volumeBar.value = lastVolume;
      updateVolumeIcon(lastVolume);
    }
  }

  function updateVolumeIcon(volume) {
    const icon = volumeToggle;
    icon.className =
      volume === 0 ? 'fas fa-volume-mute volume-icon'
      : volume < 0.5 ? 'fas fa-volume-down volume-icon'
      : 'fas fa-volume-up volume-icon';
  }

  function updateVolume() {
    const volume = parseFloat(volumeBar.value);
    audioPlayer.volume = volume;
    updateVolumeIcon(volume);
    if (volume > 0) lastVolume = volume;
  }

  // ========== التحكم في الوقت ==========
  function updateProgress() {
    const current = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    if (!isNaN(duration)) {
      progressBar.value = (current / duration) * 100;
      document.getElementById('currentTime').textContent = formatTime(current);
      document.getElementById('duration').textContent = formatTime(duration);
    }
  }

  function seekAudio() {
    if (!isNaN(audioPlayer.duration)) {
      const seekTime = (progressBar.value / 100) * audioPlayer.duration;
      audioPlayer.currentTime = seekTime;
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ========== ربط الأحداث ==========
  playBtn.onclick = playAudio;
  volumeToggle.onclick = toggleMute;
  volumeBar.addEventListener('input', updateVolume);
  progressBar.addEventListener('input', seekAudio);
  audioPlayer.addEventListener('timeupdate', updateProgress);
  closeInfoBtn.onclick = () => infoPanel.classList.remove('show');

  // ========== تشغيل التطبيق ==========
  getReciters();
});

let repeatCounter = 0;
let repeatLimit = 1;

audioPlayer.addEventListener('ended', () => {
  repeatLimit = parseInt(document.getElementById('repeatCount').value) || 1;
  if (repeatCounter < repeatLimit - 1) {
    repeatCounter++;
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else {
    repeatCounter = 0; // إعادة العداد
    pauseAudio();
  }
});

chooseSurah.addEventListener('change', () => {
  repeatCounter = 0; // إعادة التكرار عند تغيير السورة
});
