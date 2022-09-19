import { Request, Response } from 'express'
import { Application } from '../declarations'
import { NotAcceptable } from '@feathersjs/errors'

export default (app: Application) => (req: Request, res: Response): void => {
  if (typeof (req.body) !== 'undefined' && req.method === 'POST') {
    // console.log(req.body.uid)
    // console.log(req.body.token)
    app.service('accounts').find({
      query: {
        id: req.body.uid,
        verificationToken: req.body.token
      }
    })
      .then((resp: any) => {
        if (resp.total === 1) {
          app.service('accounts').patch(resp.data[0].id, {
            verificationToken: null,
            emailVerified: true
          })
            .then(() => res.send('Email verified'))
            .catch((err: Error) => {
              throw err
            })
        } else {
          res.status(403).send(new Forbidden('wrong verification'))
        }
      })
      .catch((err: Error) => {
        res.status(400).send(err)
      })
  } else {
    res.status(406).send(new NotAcceptable('wrong request'))
  }
}
