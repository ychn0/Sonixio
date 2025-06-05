window.onload = () => {
  const audio = document.getElementById('audioPlayer');
  const btnPlayPause = document.getElementById('togglePlay');
  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('results');
  const playerTitle = document.getElementById('playerTitle');
  const playerArtist = document.getElementById('playerArtist');
  const playerCover = document.getElementById('playerCover');
  const progress = document.getElementById('progress');
  const btnNext = document.getElementById('btnNext');
  const btnPrev = document.getElementById('btnPrev');
  const btnShuffle = document.getElementById('btnShuffle');
  const playlistTitle = document.getElementById('playlistTitle');

  let currentPlaylist = [];
  let currentTrackIndex = -1;
  let isShuffle = false;
  let shuffleOrder = [];

  function createShuffleOrder(length) {
    let arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function buscarMusicas(query) {
    if (!query) return [];
    console.log('Buscando músicas para:', query);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
      if (!res.ok) {
        console.error('Resposta não OK da API:', res.status);
        return [];
      }
      const data = await res.json();
      console.log('Dados recebidos:', data);
      return data.results.map(item => ({
        title: item.trackName,
        artist: { name: item.artistName },
        preview: item.previewUrl,
        album: {
          cover_small: item.artworkUrl60,
          cover_medium: item.artworkUrl100,
          title: item.collectionName
        }
      }));
    } catch (err) {
      console.error('Erro na busca:', err);
      return [];
    }
  }

  function mostrarResultados(musicas) {
    console.log('Mostrando resultados:', musicas.length, 'músicas');
    resultsDiv.innerHTML = '';
    currentPlaylist = musicas;
    currentTrackIndex = -1;
    shuffleOrder = createShuffleOrder(currentPlaylist.length);

    if (playlistTitle) {
      playlistTitle.textContent = musicas.length > 0 ? `Playlist: ${musicas[0].album.title || 'Músicas'}` : '';
    }

    if (musicas.length === 0) {
      resultsDiv.innerHTML = '<p>Nenhuma música encontrada.</p>';
      return;
    }

    musicas.forEach((musica, index) => {
      const div = document.createElement('div');
      div.classList.add('musica');
      div.innerHTML = `
        <img src="${musica.album.cover_small}" alt="Capa da música ${musica.title}">
        <strong>${musica.title}</strong> - ${musica.artist.name}
      `;
      div.onclick = () => playTrack(index);
      resultsDiv.appendChild(div);
    });
  }

  function playTrack(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    currentTrackIndex = index;
    const musica = currentPlaylist[index];
    audio.src = musica.preview;
    audio.play().catch(err => {
      console.warn('Erro ao tentar tocar:', err);
    });

    btnPlayPause.textContent = '⏸️ Pausar';

    playerTitle.textContent = musica.title;
    playerArtist.textContent = musica.artist.name;
    if (playerCover) {
      playerCover.style.backgroundImage = `url(${musica.album.cover_medium})`;
      playerCover.style.borderRadius = '8px';
      playerCover.style.backgroundSize = 'cover';
      playerCover.style.backgroundPosition = 'center';
    }

    updateProgress(0);
  }

  function updateProgress(percent) {
    if (progress) progress.style.width = `${percent}%`;
  }

  audio.ontimeupdate = () => {
    if (audio.duration) {
      const percent = (audio.currentTime / audio.duration) * 100;
      updateProgress(percent);
    }
  };

  audio.onended = () => {
    playNext();
  };

  btnPlayPause.addEventListener('click', () => {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play().catch(err => {
        console.warn('Erro ao tentar tocar:', err);
      });
      btnPlayPause.textContent = '⏸️ Pausar';
    } else {
      audio.pause();
      btnPlayPause.textContent = '▶️ Tocar';
    }
  });

  function playNext() {
    if (isShuffle) {
      let currentShuffleIndex = shuffleOrder.indexOf(currentTrackIndex);
      let nextShuffleIndex = (currentShuffleIndex + 1) % shuffleOrder.length;
      playTrack(shuffleOrder[nextShuffleIndex]);
    } else {
      if (currentTrackIndex + 1 < currentPlaylist.length) {
        playTrack(currentTrackIndex + 1);
      }
    }
  }

  function playPrev() {
    if (isShuffle) {
      let currentShuffleIndex = shuffleOrder.indexOf(currentTrackIndex);
      let prevShuffleIndex = (currentShuffleIndex - 1 + shuffleOrder.length) % shuffleOrder.length;
      playTrack(shuffleOrder[prevShuffleIndex]);
    } else {
      if (currentTrackIndex - 1 >= 0) {
        playTrack(currentTrackIndex - 1);
      }
    }
  }

  if (btnNext) btnNext.addEventListener('click', playNext);
  if (btnPrev) btnPrev.addEventListener('click', playPrev);

  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      isShuffle = !isShuffle;
      btnShuffle.textContent = isShuffle ? '🔀 Shuffle ON' : '➡️ Shuffle OFF';
      if (isShuffle) {
        shuffleOrder = createShuffleOrder(currentPlaylist.length);
      }
    });
  }

  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    const query = searchInput.value.trim();
    if (query.length === 0) {
      resultsDiv.innerHTML = '';
      currentPlaylist = [];
      currentTrackIndex = -1;
      if (playlistTitle) playlistTitle.textContent = '';
      return;
    }
    debounceTimeout = setTimeout(async () => {
      const musicas = await buscarMusicas(query);
      mostrarResultados(musicas);
    }, 300);
  });
};
