const checkBtn = document.getElementById('checkBtn')
const cityInput = document.getElementById('cityInput')
const resultsDiv = document.getElementById('results')
const canvas = document.getElementById('graph')
const ctx = canvas.getContext('2d')

const API_KEY = '041ebf941ef649e690a173212252011'

/* INITIAL GRAPH DATA (realistic baseline) */
let previousData = [40, 55, 60, 50, 65, 45, 55]
let animationStart = null
let animationFrame = null

/* Loading state */
function setLoading(isLoading) {
  if (isLoading) {
    checkBtn.innerHTML = '<span class="loading"></span> Loading'
    checkBtn.disabled = true
  } else {
    checkBtn.innerHTML = 'Check Weather'
    checkBtn.disabled = false
  }
}

/* Fetch weather */
checkBtn.addEventListener('click', function() {
  const city = cityInput.value.trim()

  if (!city) {
    resultsDiv.innerHTML = '<p style="color: var(--red)">Please enter a city</p>'
    return
  }

  setLoading(true)

  const url = 'https://api.weatherapi.com/v1/current.json?key=' + API_KEY + '&q=' + city

  fetch(url)
    .then(function(res) {
      return res.json()
    })
    .then(function(data) {
      if (data.error) {
        resultsDiv.innerHTML = '<p style="color: var(--red)">City not found</p>'
        setLoading(false)
        return
      }

      processWeather(data)
      setLoading(false)
    })
})

/* Process weather */
function processWeather(data) {
  const temp = data.current.temp_c
  const humidity = data.current.humidity
  const pressure = data.current.pressure_mb
  const wind = data.current.wind_kph

  let score = 0

  if (humidity > 70) score += 20
  if (humidity < 30) score += 10

  if (pressure < 1005) score += 30
  if (pressure > 1020) score += 15

  if (temp > 28 || temp < 3) score += 25

  if (wind > 25) score += 15

  if (score > 100) score = 100

  const riskClass = score >= 70 ? 'risk-high'
                 : score >= 40 ? 'risk-medium'
                 : 'risk-low'

  const riskLabel = score >= 70 ? 'High'
                 : score >= 40 ? 'Medium'
                 : 'Low'

  let html = ''
  html += '<h3>Weather Analysis</h3>'
  html += '<div class="weather-info">'

  html += '<div class="info-block">'
  html += '<h4>Conditions</h4>'
  html += '<p>Temperature: ' + temp + '°C<br>Humidity: ' + humidity + '%<br>Pressure: ' + pressure + ' mb<br>Wind: ' + wind + ' kph</p>'
  html += '</div>'

  html += '<div class="info-block">'
  html += '<h4>Migraine Risk</h4>'
  html += '<p><span class="risk-badge ' + riskClass + '">' + riskLabel + '</span></p>'
  html += '</div>'

  html += '</div>'
  resultsDiv.innerHTML = html

  drawGraphAnimated(score)
}

/* -------- REALISTIC GRAPH ENGINE -------- */

function drawGraphAnimated(score) {
  const targetData = [
    score - 15 < 0 ? 5 : score - 15,
    score - 5 < 0 ? 10 : score - 5,
    score,
    score + 8 > 100 ? 100 : score + 8,
    score + 15 > 100 ? 100 : score + 15,
    score - 10 < 0 ? 5 : score - 10,
    score
  ]

  if (animationFrame) cancelAnimationFrame(animationFrame)
  animationStart = null

  animateGraph(targetData)
}

function animateGraph(targetData) {
  const duration = 700

  function step(timestamp) {
    if (!animationStart) animationStart = timestamp

    const progress = Math.min((timestamp - animationStart) / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)

    const frameData = previousData.map(function(start, i) {
      return start + (targetData[i] - start) * ease
    })

    renderRealisticGraph(frameData)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    } else {
      previousData = targetData
    }
  }

  requestAnimationFrame(step)
}

function renderRealisticGraph(data) {
  canvas.width = canvas.offsetWidth
  canvas.height = 250

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const padding = 45
  const width = canvas.width - padding * 2
  const height = canvas.height - padding * 2
  const step = width / (data.length - 1)

  /* Grid */
  ctx.strokeStyle = '#273549'
  ctx.lineWidth = 1
  ctx.setLineDash([4,4])

  for (let i = 0; i <= 4; i++) {
    const y = padding + (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvas.width - padding, y)
    ctx.stroke()
  }

  ctx.setLineDash([])

  /* Points */
  let points = []
  for (let i = 0; i < data.length; i++) {
    const x = padding + i * step
    const y = padding + height - (data[i] / 100 * height)
    points.push({ x: x, y: y })
  }

  /* Smooth line */
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }

  ctx.quadraticCurveTo(
    points[points.length - 1].x,
    points[points.length - 1].y,
    points[points.length - 1].x,
    points[points.length - 1].y
  )

  const gradient = ctx.createLinearGradient(0,0,canvas.width,0)
  gradient.addColorStop(0, '#3b82f6')
  gradient.addColorStop(1, '#60a5fa')

  ctx.strokeStyle = gradient
  ctx.lineWidth = 3
  ctx.stroke()

  /* Fill */
  const fill = ctx.createLinearGradient(0, padding, 0, canvas.height)
  fill.addColorStop(0, 'rgba(59,130,246,0.25)')
  fill.addColorStop(1, 'rgba(59,130,246,0)')

  ctx.lineTo(points[points.length - 1].x, canvas.height - padding)
  ctx.lineTo(points[0].x, canvas.height - padding)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()

  /* Glowing points */
  points.forEach(function(p) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#3b82f6'
    ctx.fill()
  })
}

/* Initial render */
renderRealisticGraph(previousData)
