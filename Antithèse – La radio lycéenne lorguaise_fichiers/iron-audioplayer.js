IRON.audioPlayer = function($){
	"use strict";
	var seekTimeOut;
	var autoplayEnable


	function initPlayer( player ){
		var audioPlayer = player;
		this.audioPlayer = player;
		var waveContainer = this.audioPlayer.find('.player .wave').attr('id');
		var playlist = audioPlayer.find('.playlist');
		this.playlist = playlist;
		this.autoplayEnable = audioPlayer.data('autoplay')



		var wavesurfer = WaveSurfer.create({
			container: '#' + waveContainer,
			cursorWidth: 0,
			barWidth: 1,
			progressColor: sonaar_music.option.music_player_progress_color,
			waveColor: sonaar_music.option.music_player_timeline_color,
			height: 70,
			mediaControls: true,
			backend: 'MediaElement',
			mediaControls: false,
		});

		wavesurfer.on('loading', function(){
				var progressLoad = arguments[0]
				audioPlayer.find('.progressLoading').css('background', sonaar_music.option.music_player_timeline_color );
				audioPlayer.find('.progressLoading').css('width', 'calc( ' + progressLoad + '% - 200px )' )
				if (progressLoad == 100) {
					audioPlayer.find('.player').addClass('reveal')
					audioPlayer.find('.progressLoading').css('opacity', '0' )
				}
			})

		this.wavesurfer = wavesurfer;

		setPlaylist( playlist , wavesurfer, audioPlayer );
		setCurrentTrack( playlist.find('li').eq(0), playlist.find('li').index(), audioPlayer, wavesurfer );
		setControl( this.wavesurfer, audioPlayer, playlist);
		setNextSong( wavesurfer, audioPlayer, playlist );
		trackListItemResize();
		$(window).on('resize', function(){
			trackListItemResize();
		})

	}



	var setNextSong = function( wavesurfer, audioPlayer, playlist ){
		wavesurfer.on('finish', function(){
			next(audioPlayer,wavesurfer, playlist)
		})
	}

	var triggerPlay = function(wavesurfer, audioPlayer ){
		wavesurfer.on('ready', function(){

			if( wavesurfer.isPlaying() )
				return

			wavesurfer.play();
			togglePlaying(audioPlayer, wavesurfer)
		})
	}


	function setCurrentTrack( track, index, audioPlayer, wavesurfer ){
		var albumArt = audioPlayer.find('.album .album-art');
		var album = audioPlayer.find('.album');
		var trackTitle = audioPlayer.find('.track-title');
		var trackTime = audioPlayer.find('.track-time');
		var trackArtist = audioPlayer.find('.sr_it-artists-value');
		var albumTitle = audioPlayer.find('.album-title');
		var albumTitle = audioPlayer.find('.sr_it-playlist-title');
		var albumReleaseDate = audioPlayer.find('.sr_it-date-value');

		
		if( track.data('albumart') ){
			album.show();
			albumArt.show();
			if ( albumArt.find('img').length ) {
				albumArt.find('img').attr('src', track.data('albumart'));
			}else{
				albumArt.css('background-image', 'url(' + track.data('albumart') + ')');
			}
		}else{
			album.hide();
			albumArt.hide();
		}

		if( !audioPlayer.hasClass('show-playlist') ){
			albumArt.one('click', function(){
				setContinuousPlayer( index , audioPlayer);
			})
			albumArt.css('cursor','pointer')
		}
			audioPlayer.data('currentTrack', index);

			trackTitle.text(track.data('tracktitle'));
			trackTime.text(track.data('tracktime'));
			trackArtist.text(track.data('trackartists'));
			albumReleaseDate.text(track.data('releasedate'));
			albumTitle.text(track.data('albumtitle'));

			audioPlayer.find('.player').removeClass('hide')

			if ( !track.data('showloading') ) {
				audioPlayer.find('.player').addClass('hide')
			}else{
				audioPlayer.find('.progressLoading').css('opacity', '0.75' )
			}

			setAudio(track.data('audiopath'), wavesurfer);
			setTime( audioPlayer, wavesurfer );
		
		hideEmptyAttribut(track.data('releasedate'), audioPlayer.find('.sr_it-playlist-release-date'));
		hideEmptyAttribut(track.data('trackartists'), audioPlayer.find('.sr_it-playlist-artists'));

	}

	function setPlaylist( playlist , wavesurfer, audioPlayer ){
		playlist.find('li').each(function(){
			setSingleTrack( $(this), $(this).index(), wavesurfer, audioPlayer );
		})
	}

	function setTime( audioPlayer, wavesurfer ){
		wavesurfer.on('ready', function(){
			if( wavesurfer.isPlaying() )
				return

			var totalTime = moment.duration(wavesurfer.getDuration(), 'seconds' );
			audioPlayer.find('.totalTime').html( moment( totalTime.minutes()+':'+totalTime.seconds(), 'm:s' ).format( 'mm:ss' ) );
			wavesurfer.on('audioprocess', function(){
				var time = moment.duration(wavesurfer.getCurrentTime(), 'seconds' );
				audioPlayer.find('.currentTime').html( moment( time.minutes()+':'+time.seconds(), 'm:s' ).format( 'mm:ss' ) );
			})
		})
	}

	function setControl( wavesurfer, audioPlayer, playlist ){
		// var ctrl = audioPlayer.find('.control');
		
		audioPlayer.on('click', '.play', function(){
			togglePause(audioPlayer);

			if ( !audioPlayer.hasClass('audio-playing') ) {
				play( audioPlayer, wavesurfer )
				triggerPlay(wavesurfer, audioPlayer )
			}else{
				togglePause(audioPlayer);
			}
			togglePlaying( audioPlayer, wavesurfer);

		});
		audioPlayer.on('click', '.previous', function(){
			previous( audioPlayer, wavesurfer, playlist )
		})
		audioPlayer.on('click', '.next', function(){
			next( audioPlayer, wavesurfer, playlist )
		})

	}

	function setSingleTrack( singleTrack , eq, wavesurfer, audioPlayer ){
		var tracknumber = eq + 1;
		var trackplay = $('<span/>',{
			class: 'track-number',
			html: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 17.5 21.2" style="enable-background:new 0 0 17.5 21.2;" xml:space="preserve"><path d="M0,0l17.5,10.9L0,21.2V0z"></path><rect width="6" height="21.2"></rect><rect x="11.5" width="6" height="21.2"></rect></svg><span class="number">' + tracknumber + '</span>'
		})
		$('')
		$('<a/>',{
			class: 'audio-track',
			click: function( event ){

				if( $(this).parent().attr('data-audiopath').length == 0 ){
					return;
				}

				
				if (wavesurfer.isPlaying() && singleTrack.hasClass('current')) {
					togglePause(audioPlayer);
					togglePlaying( audioPlayer, wavesurfer);
				}else if(singleTrack.hasClass('current')){
					play( audioPlayer, wavesurfer )
				}else{
					
					togglePause(audioPlayer);
					
					setCurrentTrack( singleTrack , eq, audioPlayer, wavesurfer);
					audioPlayer.find('.playlist li').removeClass('current');
					singleTrack.addClass('current');
					triggerPlay(wavesurfer, audioPlayer);
					togglePlaying( audioPlayer, wavesurfer);
				}
			}
		}).appendTo(singleTrack).prepend(trackplay).append('<div class="tracklist-item-title">' + singleTrack.data('tracktitle') + ' <span class="tracklist-item-time">' + singleTrack.data('tracktime') + '</span></div>');
	}

	function trackListItemResize(){
		$('.playlist li').each(function(){
			var storeWidth = $(this).find('.store-list').outerWidth();
			var trackWidth = $(this).find('.track-number').outerWidth();
			$(this).find('.tracklist-item-title').css( 'max-width', $(this).outerWidth() - storeWidth - trackWidth - 10 );
		})
	};

	var setAudio = function( audio, wavesurfer ){
		seekTimeOut = setTimeout( function(){
			wavesurfer.load( audio );
		}, 250 )
	}

	function getTime( wavesurfer ){
		return wavesurfer.getCurrentTime()
	}

	function togglePlaying(audioPlayer, wavesurfer  ) {

		$.each(IRON.players, function(index, value){
			IRON.players[index].audioPlayer.removeClass('audio-playing');
		})

		if ( wavesurfer.isPlaying() ) {
			audioPlayer.addClass('audio-playing');
			return;
		}
		
		audioPlayer.removeClass('audio-playing')
	}

	function togglePause( audioplayer ){

		$.each(IRON.players, function(index, value){
			if( IRON.players[index].wavesurfer.isPlaying() ){
				IRON.players[index].wavesurfer.pause();
			}
		})
	}

	function play( audioPlayer, wavesurfer ){
		wavesurfer.playPause();
		togglePlaying( audioPlayer, wavesurfer);
	}

	function previous( audioPlayer, wavesurfer, playlist ){
		var currentTrack = audioPlayer.data('currentTrack');
		var nextTrack = currentTrack - 1;

		if ('2' < getTime( wavesurfer ) ) {
			wavesurfer.seekTo(0);
			return;
		}
		playlist.find('li').eq(nextTrack).find('a').click();

	}

	function next( audioPlayer, wavesurfer, playlist ){
		var currentTrack = audioPlayer.data('currentTrack');
		var nextTrack = currentTrack + 1;

		if ( !playlist.find('li').eq(nextTrack).length){
			nextTrack = 0;
		}
		wavesurfer.pause();
		playlist.find('li').eq(nextTrack).find('a').click();
	}

	function getPlayer(){
		return this;
	}
	function getplay(){
		play( this.audioPlayer, this.wavesurfer )
	}

	function setContinuousPlayer( eq , audioPlayer){
		IRON.sonaar.player.setPlaylist( audioPlayer, eq )
	}

	return {
		init : initPlayer,
		getPlayer : getPlayer,
		play : getplay,
		autoplayEnable : autoplayEnable,
		triggerPlay : triggerPlay

	};

}(jQuery);



function hideEmptyAttribut(string, selector){
		if(string== ''){
			selector.css('display', 'none');
		}else{
			selector.css('display', 'block');
		}
}


IRON.players = [];
jQuery('.iron-audioplayer').each(function(){

	var player = Object.create(  IRON.audioPlayer );
	player.init(jQuery(this));

	IRON.players.push(player)
})





