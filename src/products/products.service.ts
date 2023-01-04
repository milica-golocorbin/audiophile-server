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
