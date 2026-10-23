// Bootstraps two-player split-screen mode. Reads ?diff=N&map=M&p1=A&p2=B from the URL,
// configures the engine for two players, and kicks off startGame().
(function(){
  const params=new URLSearchParams(window.location.search);
  const diff=Math.max(0,Math.min(3,parseInt(params.get('diff')||'1',10)));
  const map=Math.max(0,Math.min(LAYOUTS.length-1,parseInt(params.get('map')||'0',10)));
  const p1=Math.max(0,Math.min(CHARACTERS.length-1,parseInt(params.get('p1')||'0',10)));
  const p2=Math.max(0,Math.min(CHARACTERS.length-1,parseInt(params.get('p2')||'1',10)));
  playerCount=2;
  selModeIdx=1;
  selDiffIdx=diff;
  selMapIdx=map;
  selectedMap=map;
  selP1CharIdx=p1;
  selP2CharIdx=p2;
  Music.apply();
  startGame(2,diff);
})();
