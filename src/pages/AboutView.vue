<script setup>

</script>

<template>
  <div class="about-container">
    <div class="about-card">
      <h1>About Dating Recommendations</h1>
      <p>Dating Recommendations is an innovative app that helps you find suitable partners for dates. Based on your preferences and algorithms, you receive personalized recommendations.</p>
      <h2>Features</h2>
      <ul>
        <li>Create a profile with your interests</li>
        <li>Receive daily match suggestions</li>
        <li>Communicate securely with potential partners</li>
        <li>Discover new people nearby</li>
      </ul>
      <h2>Tech stack behind it</h2>
      <ul>
        <li>User-service with spring boot</li>
        <li>Recommendation-service with go & elastic-search</li>
      </ul>
      <h2>Privacy</h2>
      <p>Your privacy is important to us. All data is stored securely and used only to provide our services.</p>

      <h2>Contact Us</h2>
      <div class="contact-item">
        <i class="pi pi-github"></i>
        <a href="https://github.com/r4mercur" target="_blank" class="github-link">Contact</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px;
}

.about-card {
  width: 100%;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  background: linear-gradient(145deg, #34495e, #2c3e50);
  color: rgba(235, 235, 235, 0.9);
}

.about-card h1 {
  color: rgba(235, 235, 235, 0.9);
  text-align: center;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 600;
}

.about-card h2 {
  color: rgba(235, 235, 235, 0.8);
  margin-top: 30px;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 600;
}

.about-card p {
  line-height: 1.6;
  margin-bottom: 16px;
  color: rgba(235, 235, 235, 0.7);
}

.about-card ul {
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 16px;
  color: rgba(235, 235, 235, 0.7);
}

.about-card li {
  margin-bottom: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.github-link {
  color: rgba(235, 235, 235, 0.8);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.github-link:hover {
  color: #ffa726;
}
</style>