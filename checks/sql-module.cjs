const fs = require('fs');
module.exports = function sqlModule(name) {
  const sql = fs.readFileSync('supabase/aureatine-full-setup.sql', 'utf8');
  const start = '-- BEGIN MODULE: ' + name, end = '-- END MODULE: ' + name;
  if (!sql.includes(start) || !sql.includes(end)) throw Error('SQL module not found: ' + name);
  return sql.split(start)[1].split(end)[0];
};
