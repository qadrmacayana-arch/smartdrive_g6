<?php
// faq.php - User-facing FAQ and simple AI assistant (client-side only)
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Help & FAQs - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="faq-page">
  <header class="faq-site-header">
    <div class="faq-site-header-inner">
      <div>
        <a href="index.php" class="faq-brand">SmartDrive™</a>
        <div class="faq-kicker">Help Center</div>
      </div>
      <div>
        <a href="dashboard.php" class="btn-primary faq-dashboard-link">Back to Dashboard</a>
      </div>
    </div>
  </header>

  <main class="faq-container">
    <div class="faq-header">
      <h1>Frequently Asked Questions</h1>
      <div class="faq-subtitle">Need more help? Ask the AI Assistant below.</div>
    </div>

    <div id="faq-list" class="faq-list" aria-live="polite"></div>

    <div class="assistant-panel" role="region" aria-label="AI Assistant">
      <div class="assistant-header">
        <strong>AI Assistant</strong>
        <button id="clear-convo" style="background:transparent;border:0;color:rgba(255,255,255,0.85);cursor:pointer">Clear</button>
      </div>
      <div id="assistant-body" class="assistant-body"></div>
      <div class="assistant-input">
        <input id="assistant-input" placeholder="Ask a question about bookings, payments, or policies..." />
        <button id="assistant-send" class="btn-primary">Send</button>
      </div>
    </div>
  </main>

  <script defer src="js/faq.js"></script>
</body>
</html>