const checkBtn = document.getElementById('checkBtn')
const cityInput = document.getElementById('cityInput')
const resultsDiv = document.getElementById('results')
const canvas = document.getElementById('graph')
const ctx = canvas.getContext('2d')

const API_KEY = '041ebf941ef649e690a173212252011'

/* INITIAL GRAPH DATA */
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
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        resultsDiv.innerHTML = '<p style="color: var(--red)">City not found</p>'
        setLoading(false)
        return
      }

      processWeather(data)
      setLoading(false)
    })
})

/* Process weather + MATCHED SCORING WITH APP */
function processWeather(data) {
  const temp = data.current.temp_c
  const humidity = data.current.humidity
  const pressure = data.current.pressure_mb
  const wind = data.current.wind_kph

  let score = 0

  // === MATCHED WITH FLUTTER APP === //
  if (humidity > 70) score += 20
  if (humidity < 30) score += 10

  if (pressure < 1005) score += 30
  if (pressure > 1020) score += 10    // CHANGED (was 15)

  if (temp < 5) score += 15           // MATCHED WITH APP
  if (temp > 28) score += 25

  if (wind > 25) score += 15

  if (score > 100) score = 100

  // === POINTS (MATCHES FLUTTER) === //
  const points = Math.floor(score / 10) // CHANGED to match `pointsEarned()` in Dart

  let totalPoints = parseInt(localStorage.getItem('totalPoints') || '0')
  totalPoints += points
  localStorage.setItem('totalPoints', totalPoints)

  // === Risk labels === //
  const riskClass = score >= 70 ? 'risk-high' : score >= 40 ? 'risk-medium' : 'risk-low'
  const riskLabel = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'

  // === UI Output === //
  let html = ''
  html += '<h3>Weather Analysis</h3>'
  html += '<div class="weather-info">'

  html += '<div class="info-block">'
  html += '<h4>Conditions</h4>'
  html += `<p>Temperature: ${temp}°C<br>Humidity: ${humidity}%<br>Pressure: ${pressure} mb<br>Wind: ${wind} kph</p>`
  html += '</div>'

  html += '<div class="info-block">'
  html += '<h4>Migraine Risk</h4>'
  html += `<p><span class="risk-badge ${riskClass}">${riskLabel}</span></p>`
  html += `<p style="margin-top:8px">Migraine Risk Score: <strong>${score}%</strong></p>`
  html += '</div>'

  html += '<div class="info-block">'
  html += '<h4>Points</h4>'
  html += `<p>Today you can win : <strong>${points}</strong> points<br></p>`
  html += '</div>'

  html += '</div>'
  resultsDiv.innerHTML = html

  drawGraphAnimated(score)
}

/* ---------- GRAPH ENGINE WITH MARKER ---------- */

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
  animateGraph(targetData, score)
}

function animateGraph(targetData, score) {
  const duration = 700

  function step(timestamp) {
    if (!animationStart) animationStart = timestamp
    const progress = Math.min((timestamp - animationStart) / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    const frameData = previousData.map((start, i) => start + (targetData[i] - start) * ease)

    renderRealisticGraph(frameData, score)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    } else {
      previousData = targetData
    }
  }

  requestAnimationFrame(step)
}

function renderRealisticGraph(data, score) {
  canvas.width = canvas.offsetWidth
  canvas.height = 270

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const padding = 55
  const width = canvas.width - padding * 2
  const height = canvas.height - padding * 2
  const step = width / (data.length - 1)

  // Graph title
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 15px Inter'
  ctx.textAlign = 'center'
  ctx.fillText('Migraine Weather Forecast', canvas.width / 2, 28)

  // Y-axis label
  ctx.save()
  ctx.translate(20, canvas.height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = '#64748b'
  ctx.font = '600 13px Inter'
  ctx.fillText('Migraine Risk (%)', 0, 0)
  ctx.restore()

  // X-axis label
  ctx.fillStyle = '#64748b'
  ctx.font = '600 13px Inter'
  ctx.fillText('Forecast Points', canvas.width / 2, canvas.height - 10)

  // Grid
  ctx.strokeStyle = '#273549'
  ctx.lineWidth = 1
  ctx.setLineDash([4,4])

  for (let i = 0; i <= 5; i++) {
    const y = padding + (height / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvas.width - padding, y)
    ctx.stroke()
    const labelVal = 100 - i * 20
    ctx.fillStyle = '#64748b'
    ctx.font = '600 12px Inter'
    ctx.textAlign = 'right'
    ctx.fillText(labelVal, padding - 10, y + 4)
  }

  ctx.setLineDash([])

  // Data to graph points
  let points = []
  for (let i = 0; i < data.length; i++) {
    const x = padding + i * step
    const y = padding + height - (data[i] / 100 * height)
    points.push({ x, y })
  }

  // Smooth line
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }
  ctx.quadraticCurveTo(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].x, points[points.length - 1].y)

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, '#3b82f6')
  gradient.addColorStop(1, '#60a5fa')

  ctx.strokeStyle = gradient
  ctx.lineWidth = 3
  ctx.stroke()

  /* FILL AREA */
  const fill = ctx.createLinearGradient(0, padding, 0, canvas.height)
  fill.addColorStop(0, 'rgba(59,130,246,0.25)')
  fill.addColorStop(1, 'rgba(59,130,246,0)')
  ctx.lineTo(points[points.length - 1].x, canvas.height - padding)
  ctx.lineTo(points[0].x, canvas.height - padding)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()

  // X labels
  ctx.fillStyle = '#64748b'
  ctx.font = '600 12px Inter'
  ctx.textAlign = 'center'
  const labels = ['1','2','3','4','5','6','7']
  labels.forEach((lbl, i) => {
    ctx.fillText(lbl, points[i].x, canvas.height - padding + 22)
  })

  /* Current score marker */
  const scorePoint = points[2]
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(96,165,250,0.25)'
  ctx.setLineDash([6,4])
  ctx.moveTo(scorePoint.x, padding)
  ctx.lineTo(scorePoint.x, canvas.height - padding)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.beginPath()
  ctx.arc(scorePoint.x, scorePoint.y, 12, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(96,165,250,0.25)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(scorePoint.x, scorePoint.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#60a5fa'
  ctx.fill()

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Inter'
  ctx.textAlign = 'center'
  ctx.fillText(score + '%', scorePoint.x, scorePoint.y - 15)
}

/* Initial */
renderRealisticGraph(previousData, 55)
