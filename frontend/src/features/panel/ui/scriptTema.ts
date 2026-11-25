/** Clave y script del modo del panel (#113), sin hooks: los importa el layout de servidor. */
export const CLAVE_TEMA = "garaje-ruta:tema";

/**
 * Lo mismo que `temaInicial` + `aplicarTema`, autocontenido para un <script> en línea del layout
 * del panel: corre antes de pintar, así no hay destello claro en modo oscuro.
 */
export const SCRIPT_TEMA = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(CLAVE_TEMA)})}catch(e){}if(t!=="claro"&&t!=="oscuro"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro"}document.documentElement.dataset.tema=t})();`;
