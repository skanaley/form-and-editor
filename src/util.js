//both of these more or less the same as Haskell's
export const intersperse = (x, ys) => ys.length === 0 ?
  [] :
  ys.slice(1).reduce((acc, y) => acc.concat(x).concat(y), [ys[0]])

export const intercalate = (xs, yss) => yss.length === 0 ?
  [] :
  yss.slice(1).reduce((acc, ys) => acc.concat(xs).concat(ys), yss[0])