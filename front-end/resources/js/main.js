/**
 * ID des joueurs
 */
var playerId = 0;
var opponentId = 0;

/**
 * Statut des jouers
 */
var isPlayerReady = false;
var isOpponentReady = false;

/**
 * Grilles des joueurs
 */
var playerGrid = null;
var playerGridInfos = null;
var opponentGrid = null;
var opponentGridInfos = null;

/**
 * ID du tableau HTML des grilles
 */
var playerGridId = 'grid-player';
var opponentGridId = 'grid-opponent';

/**
 * Tour du joueur
 * true -> au joueur
 * false -> à l'adversaire
 */
var isPlayerTurn = false;

/**
 * La partie est-elle terminée
 */
var gameEnded = false;

/**
 * Infos sur les navires
 */
var shipsInfos = [
	{ id: 0, name: "Porte-avions", size: 5 },
	{ id: 1, name: "Croiseur", size: 4 },
	{ id: 2, name: "Sous-marin", size: 3 },
	{ id: 3, name: "Contre-torpilleurs", size: 3 },
	{ id: 4, name: "Torpilleur", size: 2 }
];

/**
 * socket.io
 */
var socket = io.connect('http://localhost:8080');

// Initialisation
socket.on('init', function(data)
{
	if (!data)
	{
		alert('Impossible de rejoindre une partie');
		return; // Plus de place
	}

	playerId = data.player_id;
	playerGrid = data.player_grid;
	playerGridInfos = data.player_grid_infos;

	opponentId = data.opponent_id;
	opponentGrid = data.opponent_grid;
	opponentGridInfos = data.opponent_grid_infos;

	isPlayerTurn = (data.player_turn == playerId);

	isPlayerReady = (playerGridInfos !== null);
	isOpponentReady = (opponentGridInfos !== null);

	if (playerGridInfos === null)
	{
		// Nouvelle partie, on place les navires
		PlaceShips();
		alert('Nouvelle partie commencée');
	}
	else
	{
		// Reprise d'une partie, on actualise les grilles
		StartGame();
		RefreshGrids();
		alert('Votre partie a été récupérée');
	}

	// Modification de l'information "now playing"
	if (isPlayerTurn)
	{
		$('p#gt-player').attr('class', 'now-playing');
		$('p#gt-opponent').removeAttr('class');
	}
	else
	{
		$('p#gt-player').removeAttr('class');
		$('p#gt-opponent').attr('class', 'now-playing');
	}
});

// Mise à jour du jeu
socket.on('game_update', function(data)
{
	if (playerId == 1)
	{
		playerGrid = data.player_1_grid;
		playerGridInfos = data.player_1_grid_infos;
		opponentGrid = data.player_2_grid;
		opponentGridInfos = data.player_2_grid_infos;
	}
	else if (playerId == 2)
	{
		playerGrid = data.player_2_grid;
		playerGridInfos = data.player_2_grid_infos;
		opponentGrid = data.player_1_grid;
		opponentGridInfos = data.player_1_grid_infos;
	}
	else
	{
		return; // Non connecté
	}

	isPlayerTurn = (data.player_turn == playerId);

	isPlayerReady = (playerGridInfos !== null);
	isOpponentReady = (opponentGridInfos !== null);

	// Modification de l'information "now playing"
	if (isPlayerTurn)
	{
		$('p#gt-player').addClass('now-playing');
		$('p#gt-opponent').removeClass('now-playing');
	}
	else
	{
		$('p#gt-player').removeClass('now-playing');
		$('p#gt-opponent').addClass('now-playing');
	}

	RefreshGrids();
});

// Une case a été cliquée
socket.on('case_clicked', function(data)
{
	if (playerId == 0 || gameEnded)
	{
		return; // Non connecté ou partie terminée
	}

	// Navire coulé
	if (data.status == 2)
	{
		var shipName = shipsInfos[data.ship_id].name;
		shipName = shipName.toLowerCase();

		if (data.player_id_grid == playerId)
		{
			// Navire du joueur
			alert('Votre ' + shipName + ' a été coulé !');
		}
		else
		{
			// Navire de l'adversaire
			alert('Touché, coulé ! Vous avez coulé le ' + shipName + ' de votre adversaire !');
		}
	}
});

// La partie est terminée
socket.on('game_ended', function(winner)
{
	if (playerId == 0)
	{
		return; // Non connecté
	}

	AbortGame();

	if (winner == playerId)
	{
		alert('GG ! Vous avez gagné !');
	}
	else
	{
		alert('Vous avez perdu');
	}
});

// Un joueur a abandonné la partie
socket.on('game_aborted', function(pid)
{
	if (playerId == 0)
	{
		return; // Non connecté
	}

	AbortGame();

	if (pid == playerId)
	{
		alert('Vous avez déclaré forfait');
	}
	else
	{
		alert('Votre adversaire a délcaré forfait');
	}
});

/**
 * Initialisation du document
 */
$(document).ready(function()
{
	Init();
});
