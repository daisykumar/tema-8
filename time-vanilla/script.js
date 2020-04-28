import colors from './data/colors.js'

let main = document.querySelector('main')
let circle = document.querySelector('#circle')
let pos = 0


const setTime = () => {
    let t = new Date()
    let hours = t.getHours()
    let minutes = t.getMinutes()
    let seconds = t.getSeconds()
    circle.innerHTML = `<h1>${hours}:${minutes}:${seconds}</h1>`
    if(minutes == alarmMinutes && hours == alarmHours){
        circle.innerHTML = '<h1>ALARM</h1>'
    }
}

const setColor = () => {
    circle.style.backgroundColor = colors[pos].hex
    pos = pos < colors.length - 1 ? pos + 1 : 0
}

let timer = setInterval(setTime, 1000)
setColor()
setInterval(setColor, 5000)

let heading = document.createElement('h1')
let date = new Date()
heading.innerHTML = date.getUTCDate() + '.' + date.getMonth() + ' ' + date.getFullYear()
main.appendChild(heading)

let alarm = document.querySelector('#alarm')
let showAlarm = document.querySelector('#showAlarm')
let setAlarm = document.querySelector('#alarmSet')
let alarmSet = false
let alarmHours
let alarmMinutes

setAlarm.addEventListener('click', ()=>{
    alarmHours = document.querySelector('#hours').value
    alarmMinutes = document.querySelector('#minutes').value
    alarm.style.transform = 'translateX(100vw)'
    alarmSet = !alarmSet
    alarm.innerHTML = 'alarm set to: ' + alarmHours + ':' + alarmMinutes
})

showAlarm.addEventListener('click', () => {
    if(!alarmSet){
        alarm.style.transform = 'translateX(70vw)'
    }else{
        alarm.style.transform = 'translateX(100vw)'
    }
    alarmSet = !alarmSet
})