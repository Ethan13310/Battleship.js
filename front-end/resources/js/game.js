/**
 * Dessine une grille 10x10
 * @param {string} id -> ID de la grille
 * @return {void}
 */

function DrawGrid(id)
{
	$('div#grid-container').append('<table id="' + id + '" class="grid">');

	for (var i = 0; i < 11; ++i)
	{
		// Lignes
		$('table#' + id).append('<tr>');
	}

	for (var i = 0; i < 11; ++i)
	{
		// Colonnes
		$('table#' + id + ' tr').append('<td>');
	}

	for (var i = 1; i < 11; ++i)
	{
		// Remplissage première ligne
		$('table#' + id + ' tr:first > td').eq(i).text(String(i));
	}

	var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

	for (var i = 1; i < 11; ++i)
	{
		// Remplissage de la première colonne de chaque ligne
		$('table#' + id + ' tr').eq(i).find('td:first').text(letters[i - 1]);
	}

	// Ajout des coordonnées aux cases
	for (var y = 1; y < 11; ++y)
	{
		var row = $('table#' + id + ' tr').eq(y);

		for (var x = 1; x < 11; ++x)
		{
			row.find('td').eq(x).attr({
				'data-x': x - 1,
				'data-y': y - 1,
				'class': 'case'
			});
		}
	}

}

/**
 * Rafraichit les grilles
 * @return {boolean}
 */

function RefreshGrids()
{
	if (playerGrid !== null)
	{
		// Grille du joueur
		for (var y = 0; y < 10; ++y)
		{
			for (var x = 0; x < 10; ++x)
			{
				var c = $('table#' + playerGridId + ' tr').eq(y + 1).find('td').eq(x + 1);
				var shipId = playerGrid[x][y].ship_id;

				if (shipId != -1)
				{
					c.addClass('ship'); // Emplacement d'un navire
				}

				if (typeof playerGridInfos != 'undefined' && playerGridInfos !== null &&
					typeof playerGridInfos[shipId] != 'undefined' && playerGridInfos[shipId].lives == 0)
				{
					// Le bateau est coulé, on force son affichage
					c.addClass('sank-ship');
				}

				if (playerGrid[x][y].status == 1)
				{
					var cssClass = (playerGrid[x][y].ship_id == -1) ? 'miss' : 'hit';
					c.addClass(cssClass);
				}
			}
		}
	}

	if (opponentGrid !== null)
	{
		// Grille de l'adversaire
		for (var y = 0; y < 10; ++y)
		{
			for (var x = 0; x < 10; ++x)
			{
				var c = $('table#' + opponentGridId + ' tr').eq(y + 1).find('td').eq(x + 1);
				var shipId = opponentGrid[x][y].ship_id;

				if (typeof opponentGridInfos != 'undefined' && opponentGridInfos !== null &&
					typeof opponentGridInfos[shipId] != 'undefined' && opponentGridInfos[shipId].lives == 0)
				{
					// Le bateau est coulé, on peut l'afficher
					c.addClass('ship');
				}

				if (opponentGrid[x][y].status == 1)
				{
					var cssClass = (shipId == -1) ? 'miss' : 'hit';
					c.addClass(cssClass);
				}
			}
		}
	}

	return true;
}

/**
 * Remplit une grille avec les bateaux
 * @return {Object} La grille remplie
 */

function CreateGrid()
{
	var grid = [];

	// Création de la grille vide
	for (var x = 0; x < 10; ++x)
	{
		grid.push([]);

		for (var y = 0; y < 10; ++y)
		{
			grid[x].push({
				ship_id: -1,
				status: 0
			});
		}
	}

	if ($("div#ship-picker").length == 0)
	{
		return false; // Aucun navire dispo
	}

	var originX = -449;
	var originY = -410;
	var stepX = 41;
	var stepY = 41;

	var shipsCoords = []; // Coordonnées de chaque navire

	var isValid = true; // Tout est OK pour l'instant

	// On récupère la position de chaque navire
	$("div#ship-picker p").each(function()
	{
		var pos = $(this).position(); // Position en pixels
		var size = parseInt($(this).attr('data-ship-size'));
		var shipId = parseInt($(this).attr('data-ship-id'));
		var orientation = $(this).attr('data-orientation');

		pos.top -= originY;
		pos.left -= originX;

		if (pos.top < -5 || pos.left < -5)
		{
			isValid = false;
			return; // En dehors de la grille (en haut à gauche)
		}

		shipsCoords[shipId] = []; // Tableau des coordonnées du navire actuel

		// On parcours ses coordonnées
		for (var i = 0; i < size; ++i)
		{
			var x = Math.round(pos.left / stepX);
			var y = Math.round(pos.top / stepY);

			shipsCoords[shipId].push({
				x: x,
				y: y
			});

			// Case suivante
			switch (orientation)
			{
				case 'vertical':
					pos.top += stepY;
					break;

				case 'horizontal':
					pos.left += stepX;
					break;

				default:
					isValid = false;
					return; // Orientation invalide
			}
		}
	});

	if (!isValid || !ValidateCoords(shipsCoords))
	{
		return false;
	}

	// On remplit la grille avec les navires
	for (var i = 0; i < shipsCoords.length; ++i)
	{
		// On parcours les coordonnées du navire i
		for (var j = 0; j < shipsCoords[i].length; ++j)
		{
			var x = shipsCoords[i][j].x;
			var y = shipsCoords[i][j].y;

			grid[x][y].ship_id = i;
		}
	}

	return grid;
}

/**
 * Vérifie si des coordonnées ont été dupliquées
 * @param {Object} coords
 * @return {boolean} true -> aucune coordonnée dupliquée
 *                   flase -> coordonnée(s) dupliquée(s)
 */

function ValidateCoords(coords)
{
	var c = []; // Tableau de coordonnées triable
	var pc = null; // Coordonnée précédente

	// On crée la liste de coordonnées triable
	for (var i = 0; i < coords.length; ++i)
	{
		for (var j = 0; j < coords[i].length; ++j)
		{
			c.push(coords[i][j].x + ':' + coords[i][j].y);
		}
	}

	c.sort();

	// On vérifie que chaque coordonnée est unique
	for (var i = 0; i < c.length; ++i)
	{
		if (c[i] == pc)
		{
			return false;
		}

		pc = c[i];
	}

	return true;
}

/**
 * Clique une case de l'adversaire
 */

function ClickCase(x, y)
{
	if (playerId == 0 || opponentId == 0 || !isPlayerTurn)
	{
		// La partie n'est pas en cours ou ce n'est pas le tour du joueur
		return;
	}

	if (!isPlayerReady || !isOpponentReady)
	{
		// Un des deux joueurs n'a pas encore remplit sa grille
		return;
	}

	isPlayerTurn = false; // Au tour de l'adversaire

	socket.emit('case_clicked', {
		x: x,
		y: y
	});
}

/**
 * Initialiser le plateau de jeu
 * @return void
 */

function Init()
{
	$('div#grid-container').empty(); // Grilles
	$('div#grid-container').show();

	$('div#ship-picker').empty(); // Ship-picker
	$('div#ship-picker').hide();

	$('div#buttons').empty(); // Boutons
	$('div#buttons').hide();

	$('p#gt-player').removeClass('now-playing'); // Now playing
	$('p#gt-opponent').removeClass('now-playing');

	// Dessiner les grilles
	DrawGrid(playerGridId);
	DrawGrid(opponentGridId);

	// Clic sur une case de la grille adverse
	$('table#' + opponentGridId + ' td.case').on('click', function(e)
	{
		e.preventDefault();

		var x = parseInt($(this).attr('data-x'));
		var y = parseInt($(this).attr('data-y'));

		ClickCase(x, y);
	});

	// Initialisation avec le serveur
	socket.emit('init');
}

/**
 * Placer les bateaux
 * @return {void}
 */

function PlaceShips()
{
	// Désactivation de la grille adverse
	$('table#' + opponentGridId).hide();
	$('p#gt-opponent').hide();

	// Boutons Commencer et Réinitialiser
	$('div#buttons').append('<a href="#" id="start-button" class="button">Commencer</a>');
	$('div#buttons').append('<a href="#" id="reset-button" class="button">Réinitialiser</a>');
	$('div#buttons').show();

	// Navires à drag & drop
	$('div#ship-picker').append('<p class="s5" data-ship-size="5"></p>');
	$('div#ship-picker').append('<p class="s4" data-ship-size="4"></p>');
	$('div#ship-picker').append('<p class="s3" data-ship-size="3"></p>');
	$('div#ship-picker').append('<p class="s3" data-ship-size="3"></p>');
	$('div#ship-picker').append('<p class="s2" data-ship-size="2"></p>');
	$('div#ship-picker').css('display', 'inline-block');

	var shipId = 0;
	var left = 0;
	var zIndex = 50;

	// Placement des bateaux à côté de la grille
	$('div#ship-picker p').each(function()
	{
		var top = - $(this).height();

		$(this).css({
			'top': top + 'px',
			'left': left + 'px',
			'z-index': zIndex
		});

		$(this).attr('data-ship-id', shipId);
		$(this).attr('data-orientation', 'vertical');
		$(this).attr('data-origin-left', left + 'px');

		++shipId;
		left += 65;
		zIndex -= 5;
	});

	// Déplacable
	$('div#ship-picker p').draggable({
		cursor: 'all-scroll',
		containment: 'table#' + playerGridId,
		snap: 'td.case',
		revert: 'invalid'
	});

	// Zone de drop
	$('table#' + playerGridId).droppable({
		tolerance: 'fit'
	});

	// Rotation d'un navire
	$('div#ship-picker p').on('click', function(e)
	{
		e.preventDefault();

		// Rotation
		var width = $(this).width();
		var height = $(this).height();

		$(this).width(height);
		$(this).height(width);

		if ($(this).width() > $(this).height())
		{
			$(this).attr('data-orientation', 'horizontal');
		}
		else
		{
			$(this).attr('data-orientation', 'vertical');
		}
	});

	// Reset les navires
	$('a#reset-button').on('click', function(e)
	{
		e.preventDefault();

		$('div#ship-picker p').each(function()
		{
			var width = $(this).width();
			var height = $(this).height();

			if (width > height)
			{
				// Rotation originale
				$(this).width(height);
				$(this).height(width);
			}

			$(this).attr('data-orientation', 'vertical');

			var top = - $(this).height();

			// Replacement
			$(this).animate({
				top: top + 'px',
				left: $(this).attr('data-origin-left')
			}, 500);
		});
	});

	// Démarrer la partie après le placement des navires
	$('a#start-button').on('click', function(e)
	{
		e.preventDefault();

		StartNewGame();
	});
}

/**
 * Démarrer une nouvelle partie
 * @return {void}
 */

function StartNewGame()
{
	// Création de la grille
	var grid = CreateGrid();

	if (grid === false)
	{
		alert('Erreur : vos navires sont mal placés');
		return;
	}

	StartGame();

	// Envoyer la grille au serveur
	socket.emit('grid_sent', grid);
}

/**
 * Démarrer ou reprendre la partie
 * @return {void}
 */

function StartGame()
{
	gameEnded = false;

	// Suppression des boutons et navires à drag & drop
	$('div#buttons').hide();
	$('div#buttons').empty();

	// Boutons
	$('div#buttons').append('<a href="#" id="hide-button" class="button" data-status="displayed">Cacher les navires</a>');
	$('div#buttons').append('<a href="#" id="surrender-button" class="button">Abandonner</a>');
	$('div#buttons').show();

	// Afficher/cacher les navires
	$('a#hide-button').on('click', function(e)
	{
		e.preventDefault();

		if ($(this).attr('data-status') == 'displayed')
		{
			$(this).text('Afficher les navires');
			$(this).attr('data-status', 'hidden');
			$('table#' + playerGridId + ' td.ship').css('background-color', 'transparent');
		}
		else
		{
			$(this).text('Cacher les navires');
			$(this).attr('data-status', 'displayed');
			$('table#' + playerGridId + ' td.ship').css('background-color', '#AAAAAA');
		}
	});

	// Abandonner la partie
	$('a#surrender-button').on('click', function(e)
	{
		e.preventDefault();

		var surrender = confirm('Êtes-vous sûr(e) de vouloir déclarer forfait ?');

		if (surrender)
		{
			socket.emit('surrender');
		}
	});

	$('div#ship-picker').hide();
	$('div#ship-picker').empty();

	// Affichage de la grille
	$('table#' + opponentGridId).show();
	$('p#gt-opponent').show();
}

/**
 * La partie est terminée
 * @return {void}
 */

function AbortGame()
{
	playerId = 0;
	opponentId = 0;

	isPlayerReady = false;
	isOpponentReady = false;

	isPlayerTurn = false;
	gameEnded = true;

	$('p#gt-player').removeClass('now-playing');
	$('p#gt-opponent').removeClass('now-playing');

	$('div#ship-picker').hide();
	$('div#ship-picker').empty();

	$('div#buttons').hide();
	$('div#buttons').empty();

	// Boutons
	$('div#buttons').append('<a href="#" id="start-new-button" class="button" data-status="displayed">Nouvelle partie</a>');
	$('div#buttons').show();

	$('a#start-new-button').on('click', function(e)
	{
		e.preventDefault();

		Init();
	});
}
