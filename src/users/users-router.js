const express = require('express')
const UsersService = require('./users-service')

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter
  .post('/', jsonBodyParser, (req, res, next) => {
    const { password, user_name, full_name, nickname } = req.body;

    for (const field of ['full_name', 'password', 'user_name']) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        })
      }
    }

    const passwordError = UsersService.validatePassword(password)

    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }

    UsersService.hasUserWithUsername(req.app.get('db'), user_name)
      .then(userExists => {
        if (userExists) {
          return res.status(400).json({ error: `Username already taken` })
        }

        return UsersService.hashPassword(password)
          .then(hashedPass => {
            const newUser = {
              user_name,
              password: hashedPass,
              full_name,
              nickname
            }

            return UsersService.insertUser(req.app.get('db'), newUser)
              .then(user => {
                return res
                  .status(201)
                  .json(UsersService.serializeUser(user))
              })
          })
          .catch(next)
      })
  })

module.exports = usersRouter;