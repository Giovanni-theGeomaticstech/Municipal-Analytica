var db = openDatabase('mydb', '1.0', 'my first database', 2 * 1024 * 1024);


//Database name
//Version number
//Text description
//Estimated size of database

if (!db) {
    console.log('Database does not exist')
}
db.transaction(function (tx) {

    tx.executeSql('CREATE TABLE IF NOT EXISTS foo (id unique, text)');
    tx.executeSql('INSERT INTO foo (id, text) VALUES (1, "synergies")');
    alert('here')
    //If i want values from the user
    //tx.executeSql('INSERT INTO foo (id, text) VALUES (?, ?)', [id, userValue]);
    tx.executeSql('SELECT id FROM foo', [], function (tx, results) {
        alert('here')
        var len = results.rows.length;
        console.log(len)
        var i;
        for (i = 0; i < len; i++) {
            alert(results.rows.item(i).text);
        }
    }); //Want to select results from table
    //(Notice that in this query, there are no fields being mapped, but in order to use the third argument, I need to pass in an empty array for the second argument.)

});