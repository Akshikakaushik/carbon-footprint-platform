# 🌿 CarbonTrack — Carbon Footprint Awareness Platform

> Know Your Footprint, Change Your Future.

A smart web-based platform that helps individuals understand, track, and reduce their carbon footprint through personalized insights and an interactive calculator.

---

## 📌 Chosen Vertical

**Individual Carbon Footprint Awareness & Reduction**

The platform is designed for everyday users who want to understand the environmental impact of their daily activities and make more sustainable choices.

---

## 🏗️ Project Overview

CarbonTrack is a frontend-based application that estimates a user's annual carbon footprint based on four major lifestyle categories:

* 🚗 Transport
* 🍽️ Food
* ⚡ Home Energy
* 🛍️ Shopping & Lifestyle

Based on the calculated results, the platform provides useful recommendations to help users reduce their environmental impact.

---

## ✨ Features

* Carbon footprint calculator
* Annual CO₂ emission estimation
* Category-wise emission breakdown
* Personalized reduction recommendations
* Local browser storage using localStorage
* Responsive and user-friendly interface
* Basic AI assistant support for sustainability guidance

---

## 🛠️ Technologies Used

* HTML
* CSS
* JavaScript
* localStorage

---

## 📂 Project Structure

```
carbon-footprint-platform/
├── index.html
├── package.json
├── README.md
├── src/
│   ├── data/
│   │   └── emission-factors.js
│   └── utils/
│       ├── calculator.js
│       ├── storage.js
│       └── ai-assistant.js
└── tests/
    └── calculator.test.js
```

---

## 🚀 How to Run

### Option 1: Open Directly

Open `index.html` in any modern web browser.

### Option 2: Using a Local Server

```bash
python -m http.server 8080
```

Then open:

```
http://localhost:8080
```

---

## ⚙️ Assumptions

* Emission factors are based on publicly available estimates.
* Results are approximate and intended for awareness purposes.
* All data is stored locally in the browser.
* Calculations are performed on a per-person basis.

---

## 🔒 Privacy

* No user accounts required
* No analytics or tracking
* No external database
* User data remains in the browser through localStorage

---

## 🌍 Goal

The goal of this project is to encourage individuals to understand their environmental impact and adopt sustainable habits through awareness, education, and actionable insights.

---

### Built for the Carbon Footprint Awareness Platform Challenge.
