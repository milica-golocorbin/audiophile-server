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
