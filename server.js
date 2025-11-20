const express = require('express')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files from /src
app.use(express.static(path.join(__dirname, 'src')))

// main route → index.html
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'src', 'index.html'))
})

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT)
})
