import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { TodoService } from './todo.service'; 
import { TodoEntity } from 'src/Entity/todo.entity';
import { Any } from 'typeorm';
import { CreateTodoDto } from 'src/DTO/create_todo.dto';
import { RoleGuard } from 'src/auth/role/role.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ElasticsearchService } from 'src/elasticsearch/elasticsearch.service';
import { first } from 'rxjs';

@Controller("todos")
export class TodoController {

    // constructor(private todoService: TodoService) {}

    constructor(private readonly elasticsearchService: ElasticsearchService) {}

    /*@Post('index')
    async indexData(@Body() data: any) {
        const { index, id, body } = data;
        return this.elasticsearchService.indexData(index, id, body);
    }*/

    @Post('create')
    async createIndex(@Body(ValidationPipe) data: CreateTodoDto) {
      try {
        return await this.elasticsearchService.indexData(data);
      } catch (error) {
        console.error(error);
      }
    }
  
  
    @Post('search')
    async searchIndex(@Body() body: any) {
    //   const { index, body } = query;

      try{
        const results = await this.elasticsearchService.search(body);
        return results;
      } catch (error) {
        console.error(error);
      }

    }

    // @Body('min') min: number, @Body('first') first: number, 
    // @Body('median') median: number, @Body('third') third: number, 
    // @Body('max') max: number


    @Post('random')
    async randomNumber (){
        try {
            const results = await this.elasticsearchService.randomNumber();
            return results;
        } catch (error) {
            console.error(error);
        }
    }

    @Post('get')
    async getUsersForEventA() {
      try {
        const users = await this.elasticsearchService.getUsersForEventA();
        const results = await this.elasticsearchService.updateUsersForNextEvent(users);
        return results;
      } catch(error) {
        console.error(error);
      }
    }

    // @UseGuards(JwtAuthGuard, RoleGuard)
    
    /*@Get()
    async getAllTodos(){
        // console.log (await this.todoService.getAllTodos());
        return await this.todoService.getAllTodos();
    }

    @Post()
    @Roles('Admin')
    async postNewTodo(@Body(ValidationPipe) data: CreateTodoDto){
        // const {title, description} = data;
        // console.log (await this.todoService.postNewTodo());
        return this.todoService.postNewTodo(data);
    }


   @Put(':id')
   async updateTodo(@Param('id') id: number, @Body() data: any) {
        // const any = data;
        return await this.todoService.updateTodo(id, data);
    } 


    @Delete(':id')
    async removeTodo(@Param('id') id: number) {
        return await this.todoService.removeTodo(id);
    }*/
}
