// Date format
var d = require('./date_format');

/**
 * Activer ou désactiver le mode débug
 */
var m_enableDebugging = false;

/**
 * 0 -> erreurs + warnings
 * 1 -> (0) + requêtes socket
 * 2 -> (1) + statut de la partie
 * 3 -> (2) + retour des fonctions
 * 4 -> (3) + appel des fonction
 */
var m_verbose = 0;

/**
 * Ajouter la date et l'heure
 */
var m_enableDate = true;

/**
 * Active le mode débug
 * @return {void}
 */

var EnableDebugging = function()
{
	m_enableDebugging = true;
};

/**
 * Désactive le mode débug
 * @return {void}
 */

var DisableDebugging = function()
{
	m_enableDebugging = false;
};

/**
 * Ajouter la date aux événements
 * @return {void}
 */

var EnableDate = function()
{
	m_enableDate = true;
};

/**
 * Ne pas ajouter la date aux événements
 * @return {void}
 */

var DisableDate = function()
{
	m_enableDate = false;
};

/**
 * Modifie la sensibilité des messages
 * @param {int} verbose
 * @return {void}
 */

var SetVerbose = function(verbose)
{
	if (typeof verbose == 'number' && verbose >= 0 && verbose <= 4)
	{
		m_verbose = verbose;
	}
};

/**
 * Informations de débuggage
 * @param {string} message
 * @param {int} [verbose]
 * @return {void}
 */

var Log = function(message, verbose)
{
	if (m_enableDebugging)
	{
		if (m_enableDate)
		{
			var date = d.DateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
			message = '[' + date + '] ' + message;
		}

		if (typeof verbose == 'number')
		{
			if (verbose <= m_verbose)
			{
				console.log(message);
			}
		}
		else
		{
			console.log(message);
		}
	}
};

/**
 * Node.js module export
 */

exports.EnableDebugging  = EnableDebugging;
exports.DisableDebugging = DisableDebugging;
exports.EnableDate       = EnableDate;
exports.DisableDate      = DisableDate;
exports.SetVerbose       = SetVerbose;
exports.Log              = Log;
