/* ****************************************************************** */
 /* Constantes de configuration*/
  /*global console, fetch, clearTimeout, setTimeout, document*/
  /*eslint no-undef: "error"*/
  /*exported apiKey, serverUrl*/
  /*eslint no-unused-vars: "error"*/
  /*eslint max-len: ["error", { "code": 80, "ignoreComments": true, "ignoreTemplateLiterals": true, "ignoreStrings": true}]*/
  /*eslint max-lines-per-function: ["error", {"max": 20, "skipComments": true, "skipBlankLines" : true}]*/

 /* ****************************************************************** */
const apiKey = "efe06feb-f274-4ab5-8a9f-d0d2bad40e2e"; //"69617e9b-19db-4bf7-a33f-18d4e90ccab7";
const serverUrl = "https://lifap5.univ-lyon1.fr";

/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */

/**
 * Fait une requête GET authentifiée sur /whoami
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami(etatCourant) {
  return fetch(serverUrl + "/whoami", { headers: { "Api-Key": etatCourant.APIKey } })
    .then((response) => {
      if (response.status === 401) {
        return response.json().then((json) => {
          console.log(json);
          return { err: json.message };
        });
      } else {
        return response.json();
      }
    })
    .catch((erreur) => ({ err: erreur }));
}

/**
 * Fait une requête sur le serveur et insère le login dans la modale d'affichage
 * de l'utilisateur puis déclenche l'affichage de cette modale.
 *
 * @param {Etat} etatCourant l'état courant
 * @returns Une promesse de mise à jour
 */
 function lanceWhoamiEtInsereLogin(etatCourant) {
  return fetchWhoami(etatCourant).then((data) => {
    majEtatEtPage(etatCourant, {
      login: data.user, // qui vaut undefined en cas d'erreur
      errLogin: data.err, // qui vaut undefined si tout va bien
      loginModal: data.user === undefined, // on affiche la modale ou non
    });
  });
}

/**
 * Fait une requête GET sur /pokemon
 * @returns une promesse du tableau des pokemons ou du message d'erreur
 */
function fetchPokemon() {
  return fetch(serverUrl + "/pokemon")
  .then((response) => {
    if (response.status === 401) {
      return response.json().then((json) => {
        console.log(json);
        return { err: json.message };
      });
    } else {
      return response.json();
    }
  })
  .catch((erreur) => ({ err: erreur }));
}

/**
 * Fait une requête sur le serveur et met à jour l'etat courant.
 *
 * @param {Etat} etatCourant l'état courant
 * @returns Une promesse de mise à jour des données pokemons
 */
function lancePokemon (etatCourant) {
  return fetchPokemon().then((data) => {
    data.sort((x,y) => Number(x.PokedexNumber) - Number(y.PokedexNumber))
    majEtatEtPage(etatCourant, {
      pokemons: data,
      isSelected: 1,
    });
  });
}

/**
 * Génère le code HTML du corps du PokemonsBody.
 * @param {Etat} etatCourant 
 * @returns le code HTML
 */
function generePokemonsBody (etatCourant) {
  const tabLigne = etatCourant.pokemons.map((pokemon) => { // créé un tableau de pokemons
    const selected = etatCourant.isSelected == pokemon.PokedexNumber ? "is-selected" : "";
    return `<tr id="pokemon-${pokemon.PokedexNumber}" class="${selected}">
            <td><img alt="${pokemon.Name}" src="${pokemon.Images.Detail}" width="64"></td>
            <td><div class="content">${pokemon.PokedexNumber}</div></td>
            <td><div class="content">${pokemon.Name}</div></td>
            <td>${pokemon.Abilities.join("</br>")}</td>
            <td>${pokemon.Types.join("</br>")}</td>
          </tr>`})
    return {
    html: tabLigne.join(""), // ici renvoi une string
    callbacks: etatCourant.pokemons.map((pokemon) => 
      ({ [`pokemon-${pokemon.PokedexNumber}`]: {
        onclick: () => {
        majEtatEtPage(etatCourant, {isSelected: pokemon.PokedexNumber}); // on met à jour 
        }
      }})).reduce((acc, cur) => ({...acc, ...cur}), {})
    }
}



/**
 * Génère le code HTML du corps avec l'affichage
 * @param {Etat} etatCourant 
 * @returns 
 */
function displayPokemonsBody (etatCourant) {
  const pokemonBody = generePokemonsBody(etatCourant);
  return {
    html: `
    <div class="column">  
      <table class="table is-fullwidth">
        <thead>
            <tr>
              <th>Image</th>
              <th>#<i class="fas fa-angle-up"></i></th>
              <th>Name</th>
              <th>Abilities</th>
              <th>Types</th>
            </tr>
        </thead>
        <tbody>
            ${pokemonBody.html}
        </tbody>
      </table>
    </div>`,
    callbacks: {...pokemonBody.callbacks,}};
}

function detailHeaderPokemon (etatCourant){
  if (!etatCourant.isSelected) return {html: "", callbacks: {}};
  const pokemon = etatCourant.pokemons.find(pokemon => pokemon.PokedexNumber === etatCourant.isSelected);
  const html = `<div class="card-header">
                  <div class="card-header-title">
                    ${pokemon.JapaneseName}
                  </div>
                </div>`
  return {
    html: html,
    callbacks: {},
  }
}

function detailBodyPokemon (etatCourant){
  if (!etatCourant.isSelected) return {html: "", callbacks: {}};
  const pokemon = etatCourant.pokemons.find(pokemon => pokemon.PokedexNumber === etatCourant.isSelected);
  const html = `<article class="media">
                  <div class="media-content">
                    <h1 class="title">${pokemon.Name}</h1>
                  </div>
                </article>
                </div>
                <div class="card-content">
                <article class="media">
                  <div class="media-content">
                    <div class="content has-text-left">
                      <p>Hit points: ${pokemon.Attack}</p>
                      <h3>Abilities</h3>
                      <ul>
                        <li>${pokemon.Abilities.join("<li></li>")}}</li>
                      </ul>
                      <h3>Resistant against</h3>
                      <ul>
                        <li>${Object.keys(pokemon.Against)
                        .filter(x => pokemon.Against[x] < 1).join("<li></li>")}</li>
                      </ul>
                      <h3>Weak against</h3>
                      <ul>
                      <li>${Object.keys(pokemon.Against)
                        .filter(x => pokemon.Against[x] > 1).join("<li></li>")}</li>
                      </ul>
                    </div>
                  </div>
                  <figure class="media-right">
                    <figure class="image is-475x475">
                      <img
                        class=""
                        src="${pokemon.Images.Full}" alt="${pokemon.name}"/>
                    </figure>
                  </figure>
                </article>`
  return {
    html: html,
    callbacks: {},
  }
}

function detailFooterPokemon (etatCourant) {
  const html = `<button id="ajout-deck" class="is-success button" tabindex="0">
  Ajouter à mon deck</button>`
  return {
    html: html, 
    callbacks: {},
  }
}


function genereDetailPokemon (etatCourant) {
  const header = detailHeaderPokemon(etatCourant);
  const footer = detailFooterPokemon(etatCourant);
  const body = detailBodyPokemon(etatCourant);
  return {
    html: `
      <div class="column">
        <div class="card">
          ${header.html}
          <div class="card-content">
            ${body.html}  
          </div>
          <div class="card-footer">
            <article class="media">
            <div class="media-content">
              ${footer.html}
            </div>
            </article>
          </div>
        </div>
      </div>`,
    callbacks: { ...header.callbacks, ...footer.callbacks, ...body.callbacks },
  }
}

function generePokedex (etatCourant) {
  const pokemonsBody = displayPokemonsBody(etatCourant);
  const detailPokemon = genereDetailPokemon(etatCourant);
  return {
    html: `
      <div class="columns is-multiline">
        ${pokemonsBody.html}
        ${detailPokemon.html}
      </div>
    `,
    callbacks: { ...pokemonsBody.callbacks, ...detailPokemon.callbacks},
  }
}

/**
 * Génère le code HTML du corps de la modale de login. On renvoie en plus un
 * objet callbacks vide pour faire comme les autres fonctions de génération,
 * mais ce n'est pas obligatoire ici.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et un objet vide
 * dans le champ callbacks
 */
function genereModaleLoginBody(etatCourant) {
  return {
    html: `
      <section class="modal-card-body">
        <div class="field">
          <label class="label"> <b>Clé d'API</b> <label>
            <input id="passwordAPI" type="password" class="input">
          </div>
      </section>`,
    callbacks: {},
  };
}

/**
 * Génère le code HTML du titre de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLoginHeader(etatCourant) {
  return {
    html: `
      <header class="modal-card-head  is-back">
        <p class="modal-card-title">Utilisateur</p>
        <button
          id="btn-close-login-modal1"
          class="delete"
          aria-label="close"
        ></button>
      </header>`,
    callbacks: {
      "btn-close-login-modal1": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
      },
    },
  };
}

/**
 * Génère le code HTML du base de page de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLoginFooter(etatCourant) {
  return {
    html: `
  <footer class="modal-card-foot" style="justify-content: flex-end">
    <button id="btn-close-login-modal2" class="button">Fermer</button>
    <button id="btn-submit-login-modal2" class="button">Valider</button>
  </footer>
  
  `,
    callbacks: {
      "btn-close-login-modal2": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
      },
      
      "btn-submit-login-modal2": {
        onclick: () => {
          etatCourant.APIKey = document.getElementById("passwordAPI").value;
          lanceWhoamiEtInsereLogin(etatCourant)
        }
      },
    },
  };
}

/**
 * Génère le code HTML de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLogin(etatCourant) {
  const header = genereModaleLoginHeader(etatCourant);
  const footer = genereModaleLoginFooter(etatCourant);
  const body = genereModaleLoginBody(etatCourant);
  const activeClass = etatCourant.loginModal ? "is-active" : "is-inactive";
  return {
    html: `
      <div id="mdl-login" class="modal ${activeClass}">
        <div class="modal-background"></div>
        <div class="modal-card">
          ${header.html}
          ${body.html}
          ${footer.html}
        </div>
      </div>`,
    callbacks: { ...header.callbacks, ...footer.callbacks, ...body.callbacks },
  };
}

/* ************************************************************************
 * Gestion de barre de navigation contenant en particulier les bouton Pokedex,
 * Combat et Connexion.
 * ****************************************************************** */

/**
 * Déclenche la mise à jour de la page en changeant l'état courant pour que la
 * modale de login soit affichée
 * @param {Etat} etatCourant
 */
function afficheModaleConnexion(etatCourant) {
  majEtatEtPage(etatCourant, {loginModal: true});
}

/**
 * Génère le code HTML et les callbacks pour la partie droite de la barre de
 * navigation qui contient le bouton de login.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 *//*
function genereBoutonConnexion(etatCourant) {
  return {
    html: `
    <div class="buttons"> 
        <a id="btn-open-login-modal" class="button is-light"> 
        <span class="icon">
            <i class="fa fa-user" aria-hidden="true"></i>
          </span>
        &nbsp; Connexion</a>
    </div>`,
    callbacks: {
      "btn-open-login-modal": {
        onclick: () => afficheModaleConnexion(etatCourant),
      },
    },
  };
}*/
  
/**
 * Génère le code HTML et les callbacks pour la partie droite de la barre de
 * navigation qui contient le bouton de deconnexion.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
 function genereBoutonConnexion(etatCourant) {
  const connected = etatCourant.login === undefined;
  return {
    html:`
    <div>
      <a class="navbar-item">${connected ? "" : etatCourant.login }</a>
    </div>
    <div class="buttons"> 
        <a id="btn-connexion-modal" class=${connected ? "button is-light" : "button is-danger"}>
          <span class="icon">
            <i class="fa fa-user" aria-hidden="true"></i>
          </span>
        &nbsp; ${connected ? "Connexion" : "Déconnexion"}</a>
    </div>`,
  
    callbacks: {
      "btn-connexion-modal": {
        onclick: () => connected ?  afficheModaleConnexion(etatCourant) 
        : majEtatEtPage(etatCourant, {APIKey: undefined, login: undefined,}),
      }
    },
  };
}

/**
 * Génère le code HTML de la barre de navigation et les callbacks associés.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereBarreNavigation(etatCourant) {
  const connexion = genereBoutonConnexion(etatCourant);
  return {
    html: `
    <div class="App">
      <nav class="navbar">
      <div class="navbar-menu">
        <div class="navbar-start">
          <!-- Recherche ici -->
          <a id="btn-pokedex" class="navbar_item button is-light"> Pokedex </a>
          <a id="btn-combat" class="navbar_item button is-light"> Combat </a>
        </div>
        ${connexion.html}
      </div>
      </nav>`,
    callbacks: {
      ...connexion.callbacks,
      "btn-pokedex": { onclick: () => console.log("click bouton pokedex") },
    },
  };
}

/**
 * Génére le code HTML de la page ainsi que l'ensemble des callbacks à
 * enregistrer sur les éléments de cette page.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function generePage(etatCourant) {
  const barredeNavigation = genereBarreNavigation(etatCourant);
  const modaleLogin = genereModaleLogin(etatCourant);
  const mainPokedex = generePokedex(etatCourant);
  // remarquer l'usage de la notation ... ci-dessous qui permet de "fusionner"
  // les dictionnaires de callbacks qui viennent de la barre et de la modale.
  // Attention, les callbacks définis dans modaleLogin.callbacks vont écraser
  // ceux définis sur les mêmes éléments dans barredeNavigation.callbacks. En
  // pratique ce cas ne doit pas se produire car barreDeNavigation et
  // modaleLogin portent sur des zone différentes de la page et n'ont pas
  // d'éléments en commun.
  return {
    html: barredeNavigation.html + modaleLogin.html + mainPokedex.html,
    callbacks: { ...barredeNavigation.callbacks, ...modaleLogin.callbacks, ...mainPokedex.callbacks},
  };
}

/* ******************************************************************
 * Initialisation de la page et fonction de mise à jour
 * globale de la page.
 * ****************************************************************** */

/**
 * Créée un nouvel état basé sur les champs de l'ancien état, mais en prenant en
 * compte les nouvelles valeurs indiquées dans champsMisAJour, puis déclenche la
 * mise à jour de la page et des événements avec le nouvel état.
 *
 * @param {Etat} etatCourant etat avant la mise à jour
 * @param {*} champsMisAJour objet contenant les champs à mettre à jour, ainsi
 * que leur (nouvelle) valeur.
 */
function majEtatEtPage(etatCourant, champsMisAJour) {
  const nouvelEtat = { ...etatCourant, ...champsMisAJour };
  majPage(nouvelEtat);
}

/**
 * Prend une structure décrivant les callbacks à enregistrer et effectue les
 * affectation sur les bon champs "on...". Par exemple si callbacks contient la
 * structure suivante où f1, f2 et f3 sont des callbacks:
 *
 * { "btn-pokedex": { "onclick": f1 },
 *   "input-search": { "onchange": f2,
 *                     "oninput": f3 }
 * }
 *
 * alors cette fonction rangera f1 dans le champ "onclick" de l'élément dont
 * l'id est "btn-pokedex", rangera f2 dans le champ "onchange" de l'élément dont
 * l'id est "input-search" et rangera f3 dans le champ "oninput" de ce même
 * élément. Cela aura, entre autres, pour effet de délclencher un appel à f1
 * lorsque l'on cliquera sur le bouton "btn-pokedex".
 *
 * @param {Object} callbacks dictionnaire associant les id d'éléments à un
 * dictionnaire qui associe des champs "on..." aux callbacks désirés.
 */
function enregistreCallbacks(callbacks) {
  Object.keys(callbacks).forEach((id) => {
    const elt = document.getElementById(id);
    if (elt === undefined || elt === null) {
      console.log(
        `Élément inconnu: ${id}, impossible d'enregistrer de callback sur cet id`
      );
    } else {
      Object.keys(callbacks[id]).forEach((onAction) => {
        elt[onAction] = callbacks[id][onAction];
      });
    }
  });
}

/**
 * Mets à jour la page (contenu et événements) en fonction d'un nouvel état.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majPage(etatCourant) {
  console.log("CALL majPage");
  const page = generePage(etatCourant);
  document.getElementById("root").innerHTML = page.html;
  enregistreCallbacks(page.callbacks);
}

/**
 * Appelé après le chargement de la page.
 * Met en place la mécanique de gestion des événements
 * en lançant la mise à jour de la page à partir d'un état initial.
 */
function initClientPokemons() {
  console.log("CALL initClientPokemons");
  const etatInitial = {
    loginModal: false,
    login: undefined,
    errLogin: undefined,
    APIKey: undefined,
  };
  lancePokemon(etatInitial);
}

// Appel de la fonction init_client_duels au après chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Exécution du code après chargement de la page");
  initClientPokemons();
});
