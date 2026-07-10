<?php
// React is used for the interactive interface, while PHP serves the page and API.
// Open this file through Apache/XAMPP, not by double-clicking it.
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BizDash | Business Dashboard, Inventory, and Sales Management</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <noscript>BizDash needs JavaScript enabled because the interface is built with React.</noscript>
  <div id="root"></div>

  <!-- CDN scripts keep this school project simple: no npm install is needed. -->
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <script type="text/babel" data-presets="env,react" src="assets/js/app.jsx"></script>
</body>
</html>

