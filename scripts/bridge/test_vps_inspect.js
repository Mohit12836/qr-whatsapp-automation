const express = require('express');
const http = require('http');

// Let's test what keys exist on sessions
const req = http.get('http://127.0.0.1:3001/status', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('STATUS:', data));
});
