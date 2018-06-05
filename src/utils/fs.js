import fs from 'fs'

export const saveFile = (file, data) => {
  if (file !== '' && data !== '') {
    fs.writeFile(file, data, function (err) {
      if (err) throw err
    })
  } else {
    console.log('ERROR TRYING TO WRITE EMPTY DATA !!! <------------------------------------------------- INVESTIGATE ME ')
  }
}

export const readJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) reject(err)
      try {
        resolve(JSON.parse(data))
      } catch (e) {
        reject(e)
      }
    })
  })
}
