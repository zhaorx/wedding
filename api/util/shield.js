module.exports = function hasKey(text) {
  var keywords = ['习近平', '党', '丑', '猥琐', '龌蹉', '死', '逼'] // 数组存放敏感关键词

  for (var i = 0; i < keywords.length; i++) {
    var reg = new RegExp(keywords[i], 'gi')
    if (text.match(reg)) {
      return true
    }
  }
  return false
}
