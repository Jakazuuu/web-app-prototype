class API {
    constructor() {
        this.version = 'v1'
        this.baseUrl = `https://api.kongeos-muenchen.de/`
        this.apiUrl = `${this.baseUrl}${this.version}/`
        this.loggedIn = false

        // Load info from session Storage
        this._loadUserInfo()

        if (this.refreshToken) {
            this.updateToken()
        } else {
            this._publishLoginChange()
        }
    }

    signUp({ username, firstname, lastname, password }) {
        const urlPath = 'auth/signup'
        const url = this.baseUrl + urlPath

        return fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, firstname, lastname, password })
        })
            .then(res => res.json())
            .catch(error => {
                console.error('SignUp::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>SignUp::ERROR:</b> ' + error.toString() })
            })
    }

    signIn({ username, password }) {
        const urlPath = 'auth/signin'
        const url = this.baseUrl + urlPath

        return fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(response => {
                this.username = username
                this.refreshToken = response.refreshToken
                this.accessToken = response.accessToken
                this.clientId = response.clientId
                this.expiresAt = new Date(Date.now() + response.expiresIn * 1000)
                this._saveUserInfo()

                this.loggedIn = true
                this._publishLoginChange()

                return response
            })
            .catch(error => {
                console.error('SignIn::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>SignIn::ERROR:</b> ' + error.toString() })
            })
    }

    signOut() {
        const urlPath = 'auth/signout'
        const url = this.baseUrl + urlPath

        return fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.username,
                clientId: this.clientId
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status == 200 || data.status == 401) {
                this.loggedIn = false
                this._publishLoginChange()
                this._clearUserInfo()
            }
        })
        .catch(error => {
            console.error('SignOut::ERROR:', error)
            this.onInfoMessage({ type: 'error', message: '<b>SignOut::ERROR:</b> ' + error.toString() })
        })
    }

    updateToken() {
        const urlPath = 'auth/token'
        const url = this.baseUrl + urlPath

        return fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": this.username,
                "refreshToken": this.refreshToken,
                "clientId": this.clientId
            })
        })
            .then(res => res.json())
            .then(response => {
                this.accessToken = response.accessToken
                this.expiresAt = new Date(Date.now() + response.expiresIn * 1000)
                this._saveUserInfo()

                this.loggedIn = true
                this._publishLoginChange()
            })
            .catch(error => {
                console.error('Token::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>Token::ERROR:</b> ' + error.toString() })
            })
    }

    users() {
        const urlPath = 'users'
        const url = this.apiUrl + urlPath

        return fetch(`${url}?token=${this.accessToken}`)
            .then(res => res.json())
            .catch(error => {
                console.error('Users::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>Users::ERROR:</b> ' + error.toString() })
            })
    }

    setUserProfile({ gender, motto, university }) {
        const urlPath = `users/${this.username}`
        const url = this.apiUrl + urlPath

        return fetch(`${url}?token=${this.accessToken}`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
                username: this.username, gender, motto, university, token: this.accessToken
            })
        })
            .then(res => res.json())
            .catch(error => {
                console.error('Users::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>UsersProfile::ERROR:</b> ' + error.toString() })
            })
    }

    getUserProfile() {

    }

    /*
        content: {
            text: req.body.content.text,
            metadata: {
                date: req.body.content.metadata.date,
                image: req.body.content.metadata.image,
                geolocation: {
                    lat: req.body.content.metadata.geolocation.lat,
                    lon: req.body.content.metadata.geolocation.lon
                }
            }
        },
     */
    post(content) {
        const urlPath = `posts`
        const url = this.apiUrl + urlPath

        return fetch(`${url}?token=${this.accessToken}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
                username: this.username,
                content
            })
        })
            .then(res => res.json())
            .catch(error => {
                console.error('Post::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>Post::ERROR:</b> ' + error.toString() })
            })
    }

    getPosts() {
        const urlPath = `posts`
        const url = this.apiUrl + urlPath

        return fetch(`${url}?token=${this.accessToken}`, {
            method: 'GET'
        })
            .then(res => res.json())
            .catch(error => {
                console.error('Posts::ERROR:', error)
                this.onInfoMessage({ type: 'error', message: '<b>Posts::ERROR:</b> ' + error.toString() })
            })
    }

    _publishLoginChange() {
        if (typeof (this.onLoginStateChange) === 'function') {
            this.onLoginStateChange({
                loginState: this.loggedIn,
                username: this.username
            })
        }
    }

    _saveUserInfo() {
        localStorage['userInfo'] = JSON.stringify({
            username: this.username,
            refreshToken: this.refreshToken,
            accessToken: this.accessToken,
            clientId: this.clientId,
            expiresAt: this.expiresAt
        })
    }

    _loadUserInfo() {
        try {
            let userInfoRaw = localStorage.getItem('userInfo')
            if (userInfoRaw) {
                let userInfo = JSON.parse(userInfoRaw)
                Object.keys(userInfo)
                    .forEach(key => this[key] = userInfo[key])
            }
        } catch (loadUserInfoError) {
            console.error('API::loadUserInfo', loadUserInfoError)
        }
    }

    _clearUserInfo() {
        localStorage.removeItem('userInfo')
    }
}