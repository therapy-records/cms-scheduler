const lineBreak = '||--------------------------------------------------' + '\n';

function throwConsole(message, isErr) {
  const finalMessage = '\n' + 
    lineBreak + 
    '|| ' + message +
    '\n' + 
    lineBreak;

  if (isErr) {
    return console.error(finalMessage)
  } else {
    return console.log(finalMessage)
  }
}

module.exports = throwConsole;
