var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

ctx.canvas.width  = canvas.offsetWidth;
ctx.canvas.height = canvas.offsetHeight;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

ctx.fillStyle = 'blue';
ctx.fillRect(50, 50, 50, 50);
