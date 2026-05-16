/**
 * Wrapper pour le panel Pterodactyl.
 * Le script de démarrage du panel utilise ts-node à cause d'un bug
 * dans la condition [[ "*.js" ]] (comparaison littérale au lieu de wildcard).
 * ts-node peut exécuter ce fichier JS qui redirige vers le code compilé.
 */
require("./dist/server.js");
