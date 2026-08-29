const str = '"-----BEGIN PRIVATE KEY-----\\nMIIEvgIB...-----END PRIVATE KEY-----\\n"';
console.log('Original:', str);
console.log('Processed:', str.replace(/\\n/g, '\n').replace(/^"|"$/g, ''));
