/**
 * @file account-password-reset.ts - reset password
 * @author cmc
 * @since v0.0.1
 */
import { Request, Response } from 'express'
import { Application } from '../declarations'
import randomPassword from '../misc/random-password'
import createVerificationToken from '../misc/create-verification-token'

/**
 * @function reset password, send a verification token to the user's email address and lock the account
 * @author cmc
 *
 * @param app The feathers application
 * @param req The request, has to contain user id in params
 * @param res The response
 */
export default (app: Application) => (req: Request, res: Response): void => {
  const accounts = app.service('accounts')
  accounts.get(req.params.id)
    .then((account: any) => {
      if (account.locked === null) {
        accounts.patch(req.params.id, {
          password: randomPassword(12),
          verificationToken: createVerificationToken(16),
          locked: Date.now() + 1000 * 60 * 60 * 24
        })
          .then(() => { // resetting worked
            // TODO: send email
            res.send(true)
          })
          .catch((err: Error) => res.send(err))
      } else {
        res.status(403).send('Account is locked')
      }
    })
    .catch((err: Error) => res.send(err))
}
