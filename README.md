# Audiophile server API (NestJS, TypeORM, PostgreSQL, TS)

## DAY 01

### Generating new project.

```
nest new server
```

### Installing necessary packages for environment variables and their validation, database connection and orm, validation pipes.

```
npm i @nestjs/config joi @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/mapped-types
```

### Create .env file at the root of the project, add it to gitignore file and populate it with variables for database, port, frontend url.

**.env**

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=audiophile
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Validating environment variables.

**app.module.ts**

```
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        PORT: Joi.number(),
        FRONTEND_URL: Joi.string(),
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Connecting with PostgreSQL DB with the help of TypeORM. Create separate database.module.ts and do not forget to import it into a app.module.ts.

**db/database.module.ts**

```
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("POSTGRES_HOST"),
        port: configService.get("POSTGRES_PORT"),
        username: configService.get("POSTGRES_USER"),
        password: configService.get("POSTGRES_PASSWORD"),
        database: configService.get("POSTGRES_DB"),
        autoLoadEntities: true,
        // TODO: Change synchronize later; Once you add db migrations;
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
```

### Change port inside main.ts to read from environment variables, enable cors, enable validation of our user inputs.

**main.ts**

```
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: configService.get<string>("FRONTEND_URL"),
    credentials: true,
  });

  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
}
bootstrap();

```

### Start the server.

```
npm run start:dev
```

### Push to github.

```
git add .
```

```
git commit -m "initial configuration"
```

```
git push
```

### Create products folder. Add functions for basic CRUD to store products in the database.

### ENTITY

### Add product.entity.ts file to products folder. Entity is a class that maps to a database table.

**product.entity.ts**

```
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: "varchar", nullable: false })
  public title: string;

  @Column({ type: "text", nullable: false })
  public description: string;

  @CreateDateColumn({ type: "timestamptz", nullable: false })
  public created_at: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: false })
  public updated_at: Date;
}
```

### MODULE

### Add products.module.ts to products folder to be able to manage entities. Do not forget to add ProductsModule to imports array in the app.module.ts. We use modules to organize our application.

**products.module.ts**

```
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./product.entity";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
```

### CONTROLLER

### Add products.controller.ts to products folder with basic routes. Controllers handle incoming requests and return responses to the client.

**products.controller.ts**

```
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import { Product } from "./product.entity";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";

@Controller("/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(): Promise<Product[]> {
    return this.productsService.getProducts();
  }

  @Get(":id")
  async getProduct(@Param("id") id: number): Promise<Product> {
    return this.productsService.getProduct(id);
  }

  @Post()
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.createProduct(createProductDto);
  }

  @Put(":id")
  async updateProduct(
    @Param("id") id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(":id")
  async deleteProduct(@Param("id") id: number): Promise<Product> {
    return this.productsService.deleteProduct(id);
  }
}
```

### DTOS

### Create dtos folder inside products folder. Create create-product.dto.ts and update-product.dto.ts.

**create-product.dto.ts**

```
import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  readonly title: string;

  @IsString()
  @MinLength(32)
  @MaxLength(1024)
  readonly description: string;
}
```

**update-product.dto.ts**

```
import { CreateProductDto } from "./create-product.dto";

export class UpdateProductDto extends CreateProductDto {}
```

### SERVICE

Add products.service.ts to products folder with basic CRUD functions to access database. A job of a service is to separate the business logic from controllers.

**products.service.ts**

```
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "./product.entity";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  // READ ALL
  async getProducts(): Promise<Product[]> {
    return this.productsRepo.find();
  }

  // READ ONE
  async getProduct(id: number): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) {
      throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
    }
    return product;
  }

  // CREATE
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepo.create(createProductDto);
    return await this.productsRepo.save(product);
  }

  // UPDATE
  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productsRepo.preload({
      id,
      ...updateProductDto,
    });
    if (!product) {
      throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
    }
    return await this.productsRepo.save(product);
  }

  // DELETE
  async deleteProduct(id: number): Promise<Product> {
    const post = await this.getProduct(id);
    return await this.productsRepo.remove(post);
  }
}
```

### Start the server. Test routes and functions with Postman.

```
npm run start:dev
```

### Push to github.

```
git add .
```

```
git commit -m "basic crud operations"
```

```
git push
```
