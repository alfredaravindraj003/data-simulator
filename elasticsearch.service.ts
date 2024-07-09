import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

import { TodoEntity, TodoStatus } from 'src/Entity/todo.entity';
import { CreateTodoDto } from 'src/DTO/create_todo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { title } from 'process';
import { query } from 'express';
import { error, time } from 'console';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { randomBytes } from 'crypto';

@Injectable()
export class ElasticsearchService {
    private readonly client: Client;

    /*
    constructor(@InjectRepository(TodoEntity) private repo: 
    Repository<TodoEntity>) {
        this.client = new Client({
            node: 'http://localhost:9200',
        });
    }*/


    constructor() {
        this.client = new Client({
            // 'https://my-deployment-88c3e9.ent.asia-south1.gcp.elastic-cloud.com'
          node: 'http://localhost:9200',
          cloud: {
            id: 'My_deployment:YXNpYS1zb3V0aDEuZ2NwLmVsYXN0aWMtY2xvdWQuY29tJGYwMTc0ZDUzZDkzZTRiMDI5OTBmZjUyMzhiMjZhYWQ1JDBkMWQ5ODdjZGU5NjQ2YjI4NmM0ZjE1OGFiNjAzYmI5'
          },
          auth: {
            apiKey: 'N2ZWeGM1QUJJSVVQVFhyRHpnUTg6UVFaaUdUd3VSd1d6TXJiYjMtNmhqQQ=='
            // username: 'elastic',
            // password: 'changeme'
          }
        })
    }
    
    async indexData (createTodoDTO: CreateTodoDto) {
        // console.log(createTodoDTO)
        return await this.client.index({
            index: "todo",
            document: {
                // id: "10",
                title: createTodoDTO.title,
                description: createTodoDTO.description,
                status: TodoStatus.OPEN
            },
        });
    }

    async search (body: any) {
        // console.log(body);
        let searchQuery = {
            query: {
                match_all: {}
            }
        }
        return this.client.search({
            index: "todo",
            body: searchQuery
        });
    }

    // async randomNumber(min: number, first: number, median: number, third: number, max: number) {
        
        // Brute Force 
        
        /*const nums = [];
        const rnums = [];

        /*for(let i=0; i<1000; i++){
            nums.push(Math.floor(Math.random() * (max-min) + min));
            rnums.push({ index: {_index: "random-nums" } });
            rnums.push({ number: nums[i] });
        }

        for(let i=0; i<250; i++){
            nums.push(Math.floor(Math.random() * (first-min) + min));

            rnums.push({ index: {_index: "random-nums-f" } });
            rnums.push({ number: nums[i] });
        }

        for(let i=250; i<500; i++){
            nums.push(Math.floor(Math.random() * (median-first) + first));

            rnums.push({ index: {_index: "random-nums-f" } });
            rnums.push({ number: nums[i] });
        }

        for(let i=500; i<750; i++){
            nums.push(Math.floor(Math.random() * (third-median) + median));

            rnums.push({ index: {_index: "random-nums-f" } });
            rnums.push({ number: nums[i] });
        }

        for(let i=750; i<1000; i++){
            nums.push(Math.floor(Math.random() * (max-third) + third));

            rnums.push({ index: {_index: "random-nums-f" } });
            rnums.push({ number: nums[i] });
        }*/

    async randomNumber() {
        // Box-Muller Transform

        const nums = [];
        const rnums = [];

        const eventProb = {
            eventA: 0.3,
            eventB: 0.7
        };

        const totalWeight = Object.values(eventProb).reduce((sum, weight) => sum + weight, 0);

        for(let i=0; i<10000; i++){
            let u=0, v=0;

            while(u===0) {
                u = Math.random();
            }

            while(v===0) {
                v = Math.random();
            }

            let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            num = num/10.0 + 0.5;

            let timestamp;
            let event;

            if(num>1 || num<0) {
                i--;
                continue;
            }

            const randomEvent = Math.random() * totalWeight;
            let cumulativeWeight = 0;

            for(const [eventName, probability] of Object.entries(eventProb)) {
                cumulativeWeight += probability;

                if(randomEvent < cumulativeWeight) {
                    event = eventName;
                    break;
                }
            }

            if(event === 'eventA') {
                timestamp = new Date().getTime() + Math.random() * 1000;
            } else if(event === 'eventB') {
                timestamp = new Date().getTime() + Math.random() * 2000;
            }

            // const timestampString = format(timestamp, 'yyyy-MM-dd HH:mm:ss');
            const id = `user-${randomBytes(3).toString('hex')}`;
            // const id = uuidv4();

            nums.push(num);
            rnums.push({ index: {_index: "random-nums-trans-time-prob-c" } });
            rnums.push({ id: id, number: nums[i], timestamp: timestamp, event: event });

        }
        

        const bulkResponse = await this.client.bulk({
            refresh: true,
            body: rnums,
        });

        if(bulkResponse.errors) {
            const errDocs = [];

            bulkResponse.items.forEach((action: any, i:number) => {
                const operation = Object.keys(action)[0];
                if (action[operation].error) {
                    errDocs.push({
                        status: action[operation].status,
                        error: action[operation].error,
                        operation: rnums[i * 2],
                        document: rnums[i * 2 + 1],
                    });
                }
            });
            console.log('Bulk operation had errors:', errDocs);
        }

        // return await this.client.bulk(rnums);
        return  { indexed: nums.length, error: bulkResponse.errors};
    }

    async getUsersForEventA() {
        const response = await this.client.search({
          index: 'random-nums-trans-time-prob-c',
          body: {
            query: {
              term: { "event.keyword": 'eventA' }
            }
          }
        });
        // console.log(response);

        const users = response.hits.hits.map(hit => hit._source);
        return users;
    }


    async updateUsersForNextEvent(users) {
        const nextEventProbabilities = {
          eventC: 0.6,
          eventD: 0.4,
        };
    
        const totalWeight = Object.values(nextEventProbabilities).reduce((sum, weight) => sum + weight, 0);
    
        const updates = [];
    
        for (const user of users) {
          const randomEvent = Math.random() * totalWeight;
          let cumulativeWeight = 0;
          let nextEvent;
    
          for (const [eventName, probability] of Object.entries(nextEventProbabilities)) {
            cumulativeWeight += probability;
            if (randomEvent < cumulativeWeight) {
              nextEvent = eventName;
              break;
            }
          }

              // Calculate normally distributed timestamp difference
          const mean = 0; // Mean for normal distribution
          const stdDev = 1000; // Standard deviation for normal distribution
          const timestampDifference = Math.round(this.normalDistribution(mean, stdDev));
    
          user.timestamp = (new Date().getTime() + Math.random() * 2000) + timestampDifference;
          user.event = nextEvent;
    
          updates.push({ index: { _index: "updated-random-nums-trans-time-prob-c" } });
          updates.push(user);
        }
    
        await this.client.bulk({ body: updates });
        console.log('Users updated for next event and stored');
      }

      // Helper function to generate normally distributed values
      normalDistribution(mean: number, stdDev: number): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + num * stdDev;
      }
}
