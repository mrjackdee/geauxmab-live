fetch('https://jumpshare.com/share/1nor4VeRITOkr6vXCJw1')
  .then(res => res.text())
  .then(text => {
    const match = text.match(/https:\/\/[^"']+\.m4a/i);
    console.log(match ? match[0] : 'not found');
  });
