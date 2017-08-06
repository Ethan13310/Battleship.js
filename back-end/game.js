/**
 * La partie dure éternellement, mais a plusieurs états :
 * 0 : Aucun joueur de connecté -> Les grilles sont réinitialisées.
 * 2 : Un seul joueur de connecté -> En attente d'un second joueur.
 *     Possibilité de reprendre une partie en cours.
 * 1 : Deux joueurs connectés. Plus aucun autre joueur ne peut se connecter tant
 *     que la partie n'est pas terminée.
 */

// Debug
var debug = require('./debug');

/**
 * Etat des joueurs:
 * 0 -> déconnecté
 * 1 -> placement des navires
 * 2 -> en jeu
 */
var m_playersStatus = [0, 0];

/**
 * Tour du joueur (joueur 1 ou 2)
 * 0 -> partie non commencée ou placement des navires en cours
 */
var m_playerTurn = 0;

/**
 * Grilles
 */
var m_grids = [null, null];

/**
 * Navires présents sur les grilles, et leurs coordonnées
 */
var m_gridsInfos = [null, null];

/**
 * Retourne le statut de la partie
 * @return {int} 2 -> Les deux joueurs sont connectés, la partie est en cours
 *               1 -> Un seul joueur est connecté, la partie est en cours
 *               0 -> Aucun joueur de connecté, la partie n'est pas en cours
 */

var GetGameStatus = function()
{
	debug.Log('Call function GetGameStatus()', 4);

	var ret = 0;

	if (m_playersStatus[0] != 0 && m_playersStatus[1] != 0)
	{
		ret = 2; // Les deux joueurs sont connectés
	}
	else if ((m_playersStatus[0] == 0 && m_playersStatus[1] != 0) || (m_playersStatus[0] != 0 && m_playersStatus[1] == 0))
	{
		ret = 1; // Il manque un joueur
	}

	// ret = 0 -> aucun joueur connecté
	debug.Log('GetGameStatus() returned ' + ret, 3);
	return ret;
};

/**
 * Récupère le statut d'un joueur
 * @param {int} playerId -> L'ID du joueur 1 ou 2
 * @return {int, boolean} 0 -> déconnecté
 *                        1 -> placement des navires
 *                        2 -> en jeu
 */

var GetPlayerStatus = function(playerId)
{
	debug.Log('Call function GetPlayerStatus()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('GetPlayerStatus() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	var ret = m_playersStatus[playerId - 1];
	debug.Log('GetPlayerStatus() returned ' + ret, 3);
	return ret;
};

/**
 * Retourne le joueur qui doit jouer
 * @return {int} L'ID du joueur qui doit jouer, 0 -> pas de partie en cours
 * ou placement des navires en cours
 */

var GetPlayerTurn = function()
{
	debug.Log('Call function GetPlayerTurn()', 4);
	debug.Log('GetPlayerTurn() returned ' + m_playerTurn, 3);
	return m_playerTurn;
};

/**
 * Récupère la grille d'un joueur
 * @param {int} playerId -> L'ID du joueur (1 ou 2)
 * @return {Array, boolean}
 */

var GetGrid = function(playerId)
{
	debug.Log('Call function GetGrid()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('GetGrid() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	debug.Log('GetGrid() returned {Object} grid for player ID ' + playerId, 3);
	return m_grids[playerId - 1];
};

/**
 * Récupère les infos d'une grille
 * @param {int} playerId -> Le joueur (1 ou 2) pour lequel récupérer les infos de sa grille
 * @return {Object, boolean} Infos sur la grille
 */

var GetGridInfos = function(playerId)
{
	debug.Log('Call function GetGridInfos()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('GetGridInfos() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	debug.Log('GetGridInfos() returned {Object} grid_infos for player ID ' + playerId, 3);
	return m_gridsInfos[playerId - 1];
};

/**
 * Compte le nombre de navires en vie pour le joueur 1 ou 2
 * @param {int} playerId -> Le joueur (1 ou 2) pour lequel compter le nombre de navires en vie
 * @return {int, boolean}
 */

var CountAliveShips = function(playerId)
{
	debug.Log('Call function CountAliveShips()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('CountAliveShips() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	var playerGridInfos = m_gridsInfos[playerId - 1];

	if (playerGridInfos === null)
	{
		debug.Log('CountAliveShips() error : grid not initialized yet', 1);
		return false; // La grille n'a pas encore été initialisée
	}

	var alive = 0;

	for (var i = 0, c = playerGridInfos.length; i < c; ++i)
	{
		if (playerGridInfos[i].lives > 0)
		{
			++alive;
		}
	}

	debug.Log('CountAliveShips() returned ' + alive, 3);
	return alive;
};

/**
 * Vérifie si la partie est terminée (tous les navires d'un joueur ont été coulés)
 * @return {int} 0 -> La partie continue
 *               1 -> Le joueur 1 a gagné
 *               2 -> Le joueur 2 a gagné
 */

var CheckEndGame = function()
{
	debug.Log('Call function CheckEndGame()', 4);

	var ret = 0; // 0 -> partie toujours en cours, ou pas commencée
	var p1 = CountAliveShips(1);
	var p2 = CountAliveShips(2);

	if (p2 === 0) // p1 et p2 peuvent être égaux à false
	{
		ret = 1; // Joueur 1 a gagné
	}
	else if (p1 === 0)
	{
		ret = 2; // Joueur 2 a gagné
	}

	debug.Log('CheckEndGame() returned ' + ret, 3);
	return ret;
};

/**
 * Crée une grille pour le joueur 1 ou 2
 * @param {int} playerId -> Le joueur (1 ou 2) pour lequel initialiser la grille
 * @return {boolean}
 */

var InitializeGrid = function(playerId)
{
	debug.Log('Call function InitializeGrid()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('InitializeGrid() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	var index = playerId - 1;
	m_grids[index] = [];

	for (var x = 0; x < 10; ++x)
	{
		m_grids[index].push([]);

		for (var y = 0; y < 10; ++y)
		{
			m_grids[index][x].push({
				ship_id: -1,
				status: 0
			});
		}
	}

	debug.Log('InitializeGrid() info : grid initialized for player ID ' + playerId, 2);
	// Ne pas mettre à jour les infos de la grille permet de savoir si le joueur
	// a remplit sa grille ou non
	// UpdateGridInfos(playerId);
	return true;
};

/**
 * Ajoute les navires à la grille d'un joueur
 * @param {int} playerId -> Le joueur (1 ou 2) pour lequel créer la grille
 * @param {Object} grid -> La grille
 * @return {boolean}
 */

var CreateGrid = function(playerId, grid)
{
	debug.Log('Call function CreateGrid()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('CreateGrid() error : invalid player ID', 1);
		return false; // Player ID  invalide
	}

	var index = playerId - 1;

	// On vérifie que la grille est bien initialisée
	if (m_grids[index] === null)
	{
		debug.Log('CreateGrid() warning : grid was not initialized before', 1);

		if (!InitializeGrid(playerId))
		{
			debug.Log('CreateGrid() error : grid initialization failure', 1);
			return false; // Echec d'initialisation de la grille
		}
	}

	// Validité de la grille et du placement des navires
	if (!CheckShips(grid))
	{
		debug.Log('CreateGrid() error : "grid" parameter is invalid', 1);
		return false;
	}

	// Création de la grille
	for (var y = 0; y < 10; ++y)
	{
		for (var x = 0; x < 10; ++x)
		{
			if (grid[x][y].ship_id < 0 || grid[x][y].ship_id > 4)
			{
				grid[x][y].ship_id = -1;
			}

			m_grids[index][x][y] = {
				ship_id: grid[x][y].ship_id,
				status: 0
			};
		}
	}

	debug.Log('CreateGrid() info : grid created for player ID ' + playerId, 2);
	UpdateGridInfos(playerId);
	m_playersStatus[index] = 2; // Désormais en jeu
	return true;
};

/**
 * Vérifie si une grille est valide
 * @param {Object} grid -> La grille à vérifier
 * @return {boolean} true -> valide, false -> invalide
 */

var CheckGrid = function(grid)
{
	debug.Log('Call function IsValidGrid()', 4);

	if (typeof grid != 'object')
	{
		// Non-objet
		debug.Log('IsValidGrid() error : "grid" parameter is not an object', 1);
		return false;
	}

	if (!Array.isArray(grid) || grid.length != 10)
	{
		 // Nombre de lignes invalide
		debug.Log('IsValidGrid() error : "grid" parameter is a non-array type or its length is invalid (!= 10)', 1);
		return false;
	}

	for (var x = 0; x < 10; ++x)
	{
		if (!Array.isArray(grid[x]) || grid[x].length != 10)
		{
			// Une ligne est invalide
			debug.Log('IsValidGrid() error : "grid" parameter has an invalid row length (!= 10) or type', 1);
			return false;
		}

		for (var y = 0; y < 10; ++y)
		{
			if (typeof grid[x][y].ship_id != 'number' || typeof grid[x][y].status != 'number')
			{
				// Une case de la grille est invalide
				debug.Log('IsValidGrid() error : "grid" parameter has an invalid case type', 1);
				return false;
			}
		}
	}

	debug.Log('IsValidGrid() info : "grid" parameter is valid', 3);
	return true;
};

/**
 * Vérifie si les navries sont placés correctement
 * @param {Object} grid -> La grille
 * @return {boolean} true -> valide, false -> invalide
 */

var CheckShips = function(grid)
{
	debug.Log('Call function CheckShips()', 4);

	// Validité de la grille
	if (!CheckGrid(grid))
	{
		debug.Log('CheckShips() error : "grid" parameter is invalid', 1);
		return false;
	}

	/**
	 * @todo Vérifier server-side la validité du positionnement des navires
	 */

	return true;
};

/**
 * Met à jour les infos de la grille d'un joueur
 * @param {int} playerId -> Le joueur (1 ou 2) pour lequel mettre à jour les
 * infos de la grille
 * @return {boolean}
 */

var UpdateGridInfos = function(playerId)
{
	debug.Log('Call function UpdateGridInfos()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('UpdateGridInfos() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	var index = playerId - 1;

	if (m_grids[index] === null)
	{
		debug.Log('UpdateGridInfos() error : grid not initialized yet', 1);
		return false; // La grille n'a pas encore été initialisée
	}

	var shipsInfos = [
		{ id: 0, name: "Porte-avions", size: 5, lives: 5, coords: [] },
		{ id: 1, name: "Croiseur", size: 4, lives: 4, coords: [] },
		{ id: 2, name: "Sous-marin", size: 3, lives: 3, coords: [] },
		{ id: 3, name: "Contre-torpilleurs", size: 3, lives: 3, coords: [] },
		{ id: 4, name: "Torpilleur", size: 2, lives: 2, coords: [] }
	];

	// On compte le nombre de "touché" et les coordonnées des navires
	for (var y = 0; y < 10; ++y)
	{
		for (var x = 0; x < 10; ++x)
		{
			var c = m_grids[index][x][y];

			if (c.ship_id != -1) // Navire
			{
				shipsInfos[c.ship_id].coords.push({
					x: x,
					y: y
				});

				if (c.status != 0 && shipsInfos[c.ship_id].lives > 0)
				{
					--shipsInfos[c.ship_id].lives; // Touché
				}
			}
		}
	}

	m_gridsInfos[index] = shipsInfos;

	debug.Log('UpdateGridInfos() info : grid infos updated for player ID ' + playerId, 2);
	return true;
};

/**
 * Ajouter un joueur venant de se connecter
 * @return {int} 0 -> pas de place, non connecté
 *               1 -> connecté en tant que joueur 1
 *               2 -> connecté en tant que joueur 2
 */

var NewPlayer = function()
{
	debug.Log('Call function NewPlayer()', 4);

	var gameStatus = GetGameStatus();
	var ret = 0; // 0 -> plus de place

	if (gameStatus == 0) // Nouvelle partie
	{
		// On initialise la grille du joueur 1
		InitializeGrid(1);

		// On attribut le joueur 1, en placement des navires
		m_playersStatus[0] = 1;
		m_playerTurn = 1;

		ret = 1; // Joueur 1

		debug.Log('NewPlayer() info : the new player has been added to the game with ID 1', 2);
	}
	else if (gameStatus == 1)
	{
		// Déjà un joueur de connecté, on attribut l'ID du joueur non connecté
		if (m_playersStatus[0] == 0)
		{
			if (m_gridsInfos[0] === null) // Grille non initialisée
			{
				InitializeGrid(1);
				m_playersStatus[0] = 1; // Nouvelle grille
			}
			else
			{
				m_playersStatus[0] = 2; // Reprise de la grille
			}

			ret = 1; // Joueur 1
		}
		else if (m_playersStatus[1] == 0)
		{
			if (m_gridsInfos[1] === null) // Grille non initialisée
			{
				InitializeGrid(2);
				m_playersStatus[1] = 1; // Nouvelle grille
			}
			else
			{
				m_playersStatus[1] = 2; // Reprise de la grille
			}

			ret = 2; // Joueur 2
		}

		if (ret == 0)
		{
			// Erreur dans l'attribution de l'ID
			debug.Log('NewPlayer() error : could not attribute player ID', 1);
		}
		else
		{
			// ID attrbué avec succès
			debug.Log('NewPlayer() info : the new player has been added to the game width ID ' + ret, 2);
		}
	}
	else
	{
		debug.Log('NewPlayer() info : game is already full', 2);
	}

	debug.Log('NewPlayer() returned ' + ret, 3);
	return ret;
};

/**
 * Déconnexion d'un joueur
 * @param {int} playerId -> L'ID du joueur venant de se déconnecter (1 ou 2)
 * @return {boolean}
 */

var DisconnectPlayer = function(playerId)
{
	debug.Log('Call function DisconnectPlayer()', 4);

	if (playerId != 1 && playerId != 2)
	{
		debug.Log('DisconnectPlayer() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	var index = playerId - 1;

	if (m_playersStatus[index] == 1)
	{
		// Suppression de la grille du joueur si celui-ci était en placement des navires
		m_grids[index] = null;
		m_gridsInfos[index] = null;
	}
	else if (m_playersStatus[index] == 0)
	{
		// Le joueur est déjà déconnecté
		debug.Log('DisconnectPlayer() error : player already disconnected', 1);
		return false;
	}

	// Déconnexion
	m_playersStatus[index] = 0;
	debug.Log('DisconnectPlayer() info : player ID ' + playerId + ' disconnected', 2);

	if (GetGameStatus() == 0)
	{
		// Plus aucun joueur connecté, la partie est terminée
		debug.Log('DisconnectPlayer() info : no more player in the game', 2);
		AbortGame();
		debug.Log('DisconnectPlayer() info : game aborted', 2);
	}

	return true;
};

/**
 * Terminer la partie
 * @return {boolean}
 */

var AbortGame = function()
{
	debug.Log('Call function AbortGame()', 4);

	// Déconnexion des joueurs
	m_playersStatus = [0, 0];
	m_playerTurn = 0;
	debug.Log('AbortGame() info : players disconnected', 2);

	// Mise à zéro des grilles
	m_grids = [null, null];
	debug.Log('AbortGame() info : grids reset', 2);

	m_gridsInfos = [null, null];
	debug.Log('AbortGame() info : grids infos reset', 2);

	return true;
};

/**
 * Cliquer une case
 * @param {int} x
 * @param {int} y
 * @param {int} playerIdGrid -> La case à affecter
 * @return {Object} 0 -> raté
 *                  1 -> touché
 *                  2 -> coulé
 */

var ClickCase = function(x, y, playerIdGrid)
{
	debug.Log('Call function ClickCase()', 4);

	if (playerIdGrid != 1 && playerIdGrid != 2)
	{
		debug.Log('ClickCase() error : invalid player ID', 1);
		return false; // Player ID invalide
	}

	if (x < 0 || x > 9 || y < 0 || y > 9)
	{
		debug.Log('ClickCase() error : invalid coordinates', 1);
		return false; // Coordonnées invalides
	}

	if (m_gridsInfos[0] === null || m_gridsInfos[1] === null)
	{
		debug.Log('ClickCase() error : game has not began yet', 1);
		return false; // Un joueur n'a pas encore remplit sa grille, la partie n'a donc pas commencée
	}

	var index = playerIdGrid - 1;
	var c = m_grids[index][x][y];

	if (c.status == 0)
	{
		c.status = 1; // On marque la case comme "touchée"

		if (c.ship_id == -1)
		{
			m_playerTurn = (m_playerTurn == 1) ? 2 : 1; // Changement de tour

			debug.Log('ClickCase() info : player ID ' + playerIdGrid + '\'s grid case (x: ' + x + ', y: ' + y + ') touched -> miss', 2);
			debug.Log('ClickCase() returned 0', 3);

			return {
				ship_id: -1,
				status: 0
			}; // Raté
		}
	}
	else
	{
		debug.Log('ClickCase() error : case already hit', 1);
		return false; // Erreur, case déjà touchée
	}

	UpdateGridInfos(playerIdGrid);

	var ret = {
		ship_id: c.ship_id,
		status: 1
	}; // Touché

	if (m_gridsInfos[index][c.ship_id].lives == 0)
	{
		ret = {
			ship_id: c.ship_id,
			status: 2
		}; // Coulé
	}

	var debugShipStatus = (ret.status == 2) ? 'sank' : 'hit';

	debug.Log('ClickCase() info : player ID ' + playerIdGrid + '\'s grid case (x: ' + x + ', y: ' + y + ') touched -> ' + debugShipStatus, 2);
	debug.Log('ClickCase() returned ' + ret.status, 3);
	return ret;
};

/**
 * Node.js module export
 */

exports.GetGameStatus    = GetGameStatus;
exports.GetPlayerStatus  = GetPlayerStatus;
exports.GetPlayerTurn    = GetPlayerTurn;
exports.GetGrid          = GetGrid;
exports.GetGridInfos     = GetGridInfos;
exports.CheckEndGame     = CheckEndGame;
exports.CreateGrid       = CreateGrid;
exports.NewPlayer        = NewPlayer;
exports.DisconnectPlayer = DisconnectPlayer;
exports.AbortGame        = AbortGame;
exports.ClickCase        = ClickCase;

// Private
// exports.CountAliveShips  = CountAliveShips;
// exports.InitializeGrid   = InitializeGrid;
// exports.CheckGrid        = CheckGrid;
// exports.CheckShips       = CheckShips;
// exports.UpdateGridInfos  = UpdateGridInfos;
