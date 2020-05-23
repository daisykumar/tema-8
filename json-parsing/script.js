import Shakespeare from '../data/shakespeare.js'
let quote = document.querySelector('#quotes')
let inp = document.querySelector('#search')

const showQuote = (quote, div) => {
    let article = document.createElement('article')
    let p = document.createElement('p')
    p.innerHTML = quote
    article.appendChild(p)
    div.appendChild(article)
}

const filterQuotes = () => {
    let filtered = Shakespeare.phrases.filter(
        phrase => phrase.toLowerCase().includes(inp.value)
    )
    quotes.innerHTML = ''
    filtered.map( quote => showQuote(quote, quotes))
}

inp.addEventListener('input', filterQuotes)


/*showQuote(Shakespeare.phrases[3], quotes)
showQuote(Shakespeare.phrases[10], quotes)
showQuote(Shakespeare.phrases[17], quotes)*/

Shakespeare.phrases.map(
    quote => showQuote(quote, quotes)
)
