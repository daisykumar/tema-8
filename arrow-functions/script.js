console.log('i am here');


function square(tall, name){
    return name + 'regnestykket ditt gir: ' + tall * tall
}

console.log(square(16, ' Per '))

const squareA = tall => tall * 15 + ' er resultatet' 


console.log(squareA(21))

const fler = (name1, name2) => 'Hei' + name1 + ' og ' + name2

console.log(fler('Simon', 'Per'))

setTimeout(() => document.querySelector('body').style.backgroundColor='orange', 2000)

const antallTegn = ord => ' Dette ord har ' + ord.length + 'karakter'

console.log(antallTegn('nikodemos'))

const tallene = [12, 3, 4, 56, 67, 54, 3, 44, 43, 32]

let body = document.querySelector('body')

tallene.map(tall => {
    let newLi = document.createElement('li')
    newLi.innerHtML = tall
    body.appendChild(newLi)
})

const ordene = ['løver', 'katter', 'elefanter', 'oligarker', 'prinser']


let str = ''
ordene.map( ord => {
    str += `<section> Det satt to ${ord} på et bord</section>`
    
})

body.innerHTML = str

let books = []

fetch('https://www.googleapis.com/books/v1/volumes?q=hemingway')
    .then( response => response.json() )
    .then( json => {
    console.log(json)
    books = json.items
    str = ''
    showBooks()
})



const showBooks = () => {
    body.innerHTML = ''
    books.map( book => {
        let sec = document.createElement('section')
        sec.innerHTML = book.volumeInfo.title
        if(book.volumeInfo.imageLinks){
            sec.style.backgroundImage = `url(${book.volumeInfo.imageLinks.thumbnail})`
        }
        body.appendChild(sec)
    }
    )
}