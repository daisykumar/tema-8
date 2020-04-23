console.log('I am here')

function square(tall){
    return name + ', regnestykket ditt gir: ' + tall * tall
}

console.log( square(16, 'Per') )


const squareA = tall =>  tall * tall


console.log(squareA(21))


const fler = (name1, name2) => 'Hei ' + name1 + ' og ' + name2 

console.log(fler('Simon', 'Per'))

setTimeout(()=> document.querySelector('body').style.backgroundColor='orange', 2000)

const antallTegn = ord => 'Dette od har ' + ord.length + ' karakterer'

console.log(antallTegn('nikeodemos'))

const tallene = [
    12, 3, 4, 56, 67, 44, 34, 32
]

//for(i=0;i < tallene.length - 1; i++){
    //console.log(tallene[i])
//}

let body = document.querySelector('body')
tallene.map( tall =>  
    {
        let newLi=document.createElement('li')
        newLi.innerHTML = tall
        body.appendChild(newLi)

    }
)


const ordene = ['lover', 'katter', 'elefanter', 'prinser']
let str = ''

ordene.map( ord => {
    str += `<section>Det satt 2 ${ord}</section>`

}
)