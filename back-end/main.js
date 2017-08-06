// Debug
var debug = require('./debug');

// debug.EnableDebugging();
// debug.EnableDate();
// debug.SetVerbose(2);
debug.DisableDebugging();

// Partie
var game = require('./game');

// Serveur
var http = require('http');

// Création du serveur
var server = http.createServer(function(req, res)
{
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});

	res.end();
});

// Port du serveur (défaut: 8080)
var serverPort = 8080;

// WebSockets
var io = require('socket.io').listen(server);

// Evénements socket
io.sockets.on('connection', function(socket)
{
	// ID du joueur (1 ou 2, 0 si non connecté (pas de place))
	socket.playerId = 0;

	/**
	 * Connexion d'un nouveau joueur
	 * Attribution d'un player ID et création de sa grille
	 * Refus si déjà 2 joueurs connectés
	 */
	socket.on('init', function()
	{
		var playerId = game.NewPlayer();

		if (playerId != 0)
		{
			socket.playerId = playerId; // Enregistrement du player ID en session

			var opponentId = (playerId == 1) ? 2 : 1;

			socket.emit('init', {
				opponent_grid:       game.GetGrid(opponentId),
				opponent_grid_infos: game.GetGridInfos(opponentId),
				opponent_id:         opponentId,
				player_grid:         game.GetGrid(playerId),
				player_grid_infos:   game.GetGridInfos(playerId),
				player_id:           playerId,
				player_turn:         game.GetPlayerTurn()
			});
			// Connecté
		}
		else
		{
			// Erreur
			socket.emit('init', false);
		}
	});

	/**
	 * Déconnexion du joueur
	 */
	socket.once('disconnect', function()
	{
		if (socket.playerId != 0)
		{
            game.DisconnectPlayer(socket.playerId);

            socket.broadcast.emit('player_disconnected', {
                player_id: socket.playerId
            });

            socket.playerId = 0;
        }
	});

	/**
	 * Envoi de la grille du joueur avec les navires placés
	 * La partie commence
	 */
	socket.on('grid_sent', function(grid)
	{
		if (socket.playerId == 0 || game.GetPlayerStatus(socket.playerId) != 1)
		{
			return; // Non connecté ou navires déjà placés
		}

		var gridCreated = game.CreateGrid(socket.playerId, grid);

		if (gridCreated) // Succès de création de la grille
		{
			var p1Grid = game.GetGrid(1);
			var p2Grid = game.GetGrid(2);
			var p1GridInfos = game.GetGridInfos(1);
			var p2GridInfos = game.GetGridInfos(2);

			io.sockets.emit('game_update', {
				player_1_grid:       p1Grid,
				player_1_grid_infos: p1GridInfos,
				player_1_ready:      (p1GridInfos !== null),
				player_2_grid:       p2Grid,
				player_2_grid_infos: p2GridInfos,
				player_2_ready:      (p2GridInfos !== null),
				player_turn:         game.GetPlayerTurn()
			});
		}
	});

	/**
	 * Le joueur a cliqué sur une case de la grille adverse
	 * Modification des grilles
	 */
	socket.on('case_clicked', function(caseClicked)
	{
		if (socket.playerId == 0)
		{
			return; // Non connecté
		}

		var x = caseClicked.x;
		var y = caseClicked.y;
		var opponentId = (socket.playerId == 1) ? 2 : 1;

		// Infos sur la case cliquée (raté, touché, coulé)
		var result = game.ClickCase(x, y, opponentId);

		var p1Grid = game.GetGrid(1);
		var p2Grid = game.GetGrid(2);
		var p1GridInfos = game.GetGridInfos(1);
		var p2GridInfos = game.GetGridInfos(2);

		io.sockets.emit('game_update', {
			player_1_grid:       p1Grid,
			player_1_grid_infos: p1GridInfos,
			player_1_ready:      (p1GridInfos !== null),
			player_2_grid:       p2Grid,
			player_2_grid_infos: p2GridInfos,
			player_2_ready:      (p2GridInfos !== null),
			player_turn:         game.GetPlayerTurn()
		});

		if (result === false)
		{
			return; // Erreur
		}

		// Vérification fin de partie
		switch(game.CheckEndGame())
		{
			case 1:
				io.sockets.emit('game_ended', 1); // Joueur 1 a gagné
				game.AbortGame();
				break;

			case 2:
				io.sockets.emit('game_ended', 2); // Joueur 2 a gagné
				game.AbortGame();
				break;

			default:
				io.sockets.emit('case_clicked', {
					player_id_grid: opponentId, // L'ID du joueur s'étant fait touché
					ship_id: result.ship_id,    // Le navire touché (-1 si dans l'eau)
					status: result.status       // Le résultat de l'opération (raté, touché, coulé)
				});
				// La partie continue
		}
	});

	/**
	 * Abandonner la partie
	 */
	socket.on('surrender', function()
	{
		if (socket.playerId == 0)
		{
			return; // Non connecté
		}

		io.sockets.emit('game_aborted', socket.playerId);
		game.AbortGame();
	});
});

server.listen(serverPort);
debug.Log('Server started (listening on port ' + serverPort + ')');
