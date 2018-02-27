module.exports = function () {

  var info = {
    name: "Rand1111"
  };

  function update(game) {
    if (game.state !== "complete") {
      return 11 + Math.random() * 11
    }
  }

  return { update: update, info: info }

}
