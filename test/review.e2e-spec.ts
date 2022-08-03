import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateReviewDto } from '../src/review/dto/create-review.dto';
import { Types, disconnect } from 'mongoose';
import { REVIEW_NOT_FOUND } from '../src/review/review.constants';

const productId = new Types.ObjectId().toHexString();
const testDto: CreateReviewDto = {
	name: 'TestName',
	title: 'TestTitle',
	description: 'Lorem Ipsum',
	rating: 5,
	productId,
};

describe('Review Controller (e2e)', () => {
	let app: INestApplication;
	let createdId: string;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/review/create (POST) - success', async () => {
		const req = request(app.getHttpServer()).post('/review/create').send(testDto);
		req.expect(201);
		const resp = await req;
		createdId = resp.body._id;
		expect(createdId).toBeDefined();
	});

	it('/review/create (POST) - failure', async () => {
		const req = request(app.getHttpServer())
			.post('/review/create')
			.send({ ...testDto, rating: 0 });
		await req.expect(400);
		const resp = await req;
		console.log(resp.body);
	});

	it('/byProduct/:productId (GET) - success', async () => {
		const req = request(app.getHttpServer()).get('/review/byProduct/:' + productId);
		await req.expect(200);
		const resp = await req;
		expect(resp.body.length).toBe(1);
	});

	it('/byProduct/:productId (GET) - failure', async () => {
		const req = request(app.getHttpServer()).get(
			'/review/byProduct/:' + new Types.ObjectId().toHexString(),
		);
		await req.expect(200);
		const resp = await req;
		expect(resp.body.length).toBe(0);
	});

	it('/review/:id (DELETE) - success', async () => {
		const req = request(app.getHttpServer()).delete('/review/:' + createdId);
		await req.expect(200);
	});

	it('/review/:id (DELETE) - failure', async () => {
		const req = request(app.getHttpServer()).delete(
			'/review/:' + new Types.ObjectId().toHexString(),
		);
		await req.expect(404, {
			statusCode: 404,
			message: REVIEW_NOT_FOUND,
		});
	});

	afterAll(() => {
		disconnect();
	});
});