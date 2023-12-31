import app from '../../src/app'
// @ts-expect-error
import request from 'supertest'
// @ts-expect-error
import { createTestUser, getAuthenticationToken, sendAuthenticatedRequest } from '../helpers'

describe('enrollmentGetAll middleware', () => {
  let userId: string
  let token: string
  let courseId: string

  beforeAll(async () => {
    await createTestUser({
      email: 'test@AuthorMail.de',
      username: 'testAuthorEnrollment',
      password: 'test',
      role: 'author'
    })
      .then(async (res) => {
        userId = res.id
        token = await getAuthenticationToken('test@AuthorMail.de', 'test')
      })
    await app.service('courses').create({
      name: 'testCourse',
      category: 'test',
      authorId: userId
    })
      .then((res) => {
        courseId = res.id
      })
  })

  afterAll(async () => {
    await app.service('accounts').remove(userId)
    await app.service('courses').remove(courseId)
    await app.service('accounts').find({ query: { username: 'testStudent' } })
      .then((res: any) => {
        res.data.forEach(async (user: any) => {
          await app.service('accounts').remove(user.id)
        })
      })
    await app.service('courses').find({ query: { name: 'testCourse' } })
      .then((res: any) => {
        res.data.forEach(async (course: any) => {
          await app.service('courses').remove(course.id)
        })
      })
  })

  it('fails if not authenticated', async () => {
    await request(app)
      .get('/enrollments/all')
      .send({ courseId: 't3stkur5' })
      .expect(401)
  })

  it('fails for wrong request method', async () => {
    await request(app)
      .post('/enrollments/all')
      .send({ courseId: 't3stkur5' })
      .expect(405)
  })

  it('fails if no params are given', async () => {
    const resp = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token)
    expect(resp.status).toBe(400)
  })

  it('fails if neither courseId nor studentId are given', async () => {
    const resp = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token, { someOtherKey: 'kek' })
    expect(resp.status).toBe(400)
  })

  it('returns empty array if no enrollments for courseId are found', async () => {
    const resp = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token, { courseId: 't3stkur5' })
    expect(resp.status).toBe(200)
    expect(resp.body).toEqual([])
  })

  it('returns empty array if no enrollments for studentId are found', async () => {
    const resp = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token, { studentId: 't3ststüd3nt' })
    expect(resp.status).toBe(200)
    expect(resp.body).toEqual([])
  })

  // skipped because foreign keys are not saved in jest
  it.skip('returns all enrollments for courseId', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestUser({
        email: `testStudentMail-${i}@mail.de`,
        username: `testStudent-${i}`,
        password: 'test'
      })
        .then(async (res) => {
          await app.service('enrollments').create({
            courseId: courseId,
            studentId: res.id
          })
            .catch((err) => {
              console.log(err.message)
            })
        })
        .catch((err) => {
          console.log(err.message)
        })
    }
    const resp = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token, { courseId: courseId })
    expect(resp.status).toBe(200)
    expect(resp.body.length).toBe(5)
  })

  // skipped because foreign keys are not saved in jest
  it.skip('returns all enrollments for studentId', async () => {
    for (let i = 0; i < 5; i++) {
      await app.service('courses').create({
        name: `testCourse-${i}`,
        category: 'test',
        authorId: userId
      })
    }
    await createTestUser()
      .then(async (resp) => {
        const res = await sendAuthenticatedRequest(app, 'get', '/enrollments/all', token, { studentId: resp.id })
        expect(res.status).toBe(200)
        expect(res.body.length).toBe(5)
      })
  })
})
