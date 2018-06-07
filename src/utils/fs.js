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
