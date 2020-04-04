firebase.database().ref('exercises').on('value', (snapshot) => {
    snapshot.val().map(d => {
        $("#exerciseCards").append(`<a class="card" href="./html/ex1.html?exID=`+d.id+`">
            <div class="image">
            <img class='thumbnail' src="`+d.img+`">
            </div>
            <div class="content">
            <div class="header">`+d.name+`</div>
            <div class="meta">
                <span class="date">`+d.exerciseType+`</span>
            </div>
            <div class="description">
            `+d.description+`
            </div>
            </div>
            <div class="extra content">
            <span class="right floated">
            `+d.date+`
            </span>
            <span>
                <i class="user icon"></i>
                `+d.subscribers+` Subscribers
            </span>
            </div>
        </a> `)
    })

});




