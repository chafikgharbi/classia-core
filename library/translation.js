export const __ = (value) => {
  try {
    const lang = localStorage.getItem("language")

    if (!lang || lang == "fr")
      return value

    const translations = require("../languages/" + lang)
    return translations[value] || value
  } catch (err) {
    return value
  }
}

export const _t = (value) => {
  try {
    const lang = localStorage.getItem("language")

    if (!lang || lang == "fr")
      return value

    const translations = require("../../src/languages/" + lang)
    return translations[value] || value
  } catch (err) {
    return value
  }
}