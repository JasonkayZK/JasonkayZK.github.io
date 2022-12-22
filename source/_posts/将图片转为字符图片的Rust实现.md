---
title: 将图片转为字符图片的Rust实现
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?88'
date: 2022-12-22 11:44:56
categories: Rust
tags: [Rust, 技术杂谈]
description: 最近看了一篇文章可以将图片转换为文字图片，觉得挺有意思的，就花了半个小时 Rust 也实现了一个；
---

最近看了一篇文章可以将图片转换为文字图片，觉得挺有意思的，就花了半个小时 Rust 也实现了一个；

源代码：

-   https://github.com/JasonkayZK/img2txt-rs

<br/>

<!--more-->

# **将图片转为字符图片的Rust实现**

## **前言**

实现效果如下：

![img](https://raw.fastgit.org/JasonkayZK/img2txt-rs/main/examples//example3.jpg)

转换后的结果：

```
                                                                                                                        
                                                                                                                        
                                                                                                                        
                                                                                                                        
                                                                                :ooo:                                   
                                   .:o:.                                      .:...:ooo                                 
                                   .:o**o.                                   ..   .  .oo.                               
                                      .:*o.      .........................  ... ..:::. :o                               
                                     ....    ..::::...          ...... .......:&####&&: ::                              
                                  .:o*&&*:   ......                       ...::*#@WW@8&: :.                             
                                 o*o&8&***::.                               .:o**8@WW@#&:.:                             
                                o&&#WW@@##&:                                .:oo**&#WW@&* o                             
                               .:8@@W@##@#*:.                               ..:oo**&#W@&*.o.                            
                                *@@@W@@@@8*:                                  ..ooo*&#W8o.o:                            
                               .8@@@W@@#8*.         ....:::............         .:o:*&@#o.o.                            
                               :@@@@@@#&o.       ...:::ooooooooooooooo::....      :::o&@o.o.                            
                            .  o@@@#@#*:      ....:ooooooo::::::::::oooo::::..     :.::8&.o.                            
                            o. :W@##8o.      ....:oo::......::::::::....:ooo::...   ..::*.o                             
                              .:###8:       ...::.. ..:::ooooo********oo::::ooo:..   . ...o                             
                              .:88&:       ..::. .:ooooooooooooooooo******oo::o*o:.      ..                             
                               o&o.       .:.. .oo*oooooooo::::::::::::o**&&&&oo**o:.                                   
                              .:.       .::. .o*oooooo:::::::::::::::::::o*&&&&*o***:.                                  
                             ..        .::  o*oo::::::::::::::::....:::::::o**&&&*o**o.                                 
                             :        .:. .**o:::...:::......      .....:oo::o*&&&*oo*o.                                
                            ..       .:. :&*::.......                    .::o::o*&&*oo&*.                               
                            .       :o. :*o:......                          .:oo:o&&&oo&o              ..:::..          
                                   .o. :*o:....                               .oo:o*&*o*&:          .::... ..:::.       
                                  .o: :*o....                                   :*oo*&*o**.        ::   :oo:.  .:.      
                                 .:: :oo....                                     .ooo&&oo*:       .. .&@WWWW#8:  ..     
                                 :o .*o...                                 .:.     ooo&*oo*.        o@WWWWW@@WW*  o     
                                .o..oo:..      .o&##8*:                  o8@W@8*.   oo*&oo*:       :@W@@@@W@WWW@: ::    
                            .  .:: :o:..     .*#WWWWWW@8.              .8WWWWWWW@*  .oo*&:o*.      &@@@@@@@W@@@@8  :    
                              ..o..o:..     o@WWWWWWWWWW#.             8WWWWWWWWWW8. .oo&oo*:.     #@@@@@@@@@@@8*  :    
                           .  .:: :o..     &WWWWWWWWWWWWW8            oWWWWWWWWWWWW#. :o**:oo..   .@@@@@@#@@@@@&o  :    
                          .. ..o..o:.    .#WWWWWWWWWWWWWWWo           8WWWWW@@WWWWWW#. oo*:o*:.   :@@@@@@@@@@@#&:  :    
                          .. .::.::..   :@WWWWWW&***@WWWWW&           @WWW#***o@WWWWW#..o*o:*o... &@@@@@@@@@@W#&.  o    
                         ..  .o..o..   .@WWWWW@*#88#o#WWWW8          .WWW8&&.8@o@WWWWW& o**:oo..:o8@@@@@@@@@WW#*  .:    
                        ... .:o.:::.  .#WWWWWW**#  @@:@WWW8           @W@*8* *W#&WWWWWWo.**o:*:.o*8#@@@@@@@WW@8.  :.    
                        .:. .o:.::.   &WWWWWW#&#8*&#W&&WWW8           #W8###@@@WoWWWWWW#.**o:*o:**&8@@@@@@WW@@*   o     
                        .. ..o.:::.  :WWWWWWW&8##WW@@#oWWW*           *W&#8WWW@W*@WWWWWWoo***o*:&*&8@@@@@WWWW@.  ::     
                       .:. .:o.:::   #WWWWWWW&##WWW@@@oWW@.   .&&**&: .@&@#WWW#@o@WWWWWW#:*&8o*o&&&8@@WWWWWWWo   :      
                       .:. .:::o::  oWWWWWWWW&###@W#@#*WW&    @@&&&#W: &&#8&###@:WWWWWWWWo**8o*o*&&8@WWWWWWW8   ::      
                      .::. .:::::.  8WWWWWWWW#&#&&88W&&W#    .W@@@@@W* .&&@8&#W**WWWWWWWW&*&8*oo*&&8@WWWWWW#   .o       
                      .:.  .o:::o.  @WWWWWWWWW&#@##W#*WW:     &WWWWWW:  o*&@@@*:@WWWWWWWW8o&8*o*o**8@WWWWW@.   o.       
                      .:.  .o:::o  :WWWWWWWWWWW&8@@8&@W&       &WWW@o    88**o*@WWWWWWWWW#o&8&o*:oo8@WWWW@:   ::        
                      ::.  .o:::o  :WWWWWWWWWWWW@###WW#         :**:.    :WW@WWWWWWWWWWWW@o&&&:*:oo8@WWWWo   .o         
                     .:.   .o:::o  :WWWWWWWWWWWWWWWWW@.           ..      oWWWWWWWWWWWWWW@o*&&:oooo8#@WWo   .o.         
                     .:.   .o:::o  .@WWWWWWWWWWWWWWW@:   ..           ..   o@WWWWWWWWWWWW@o**&:oo:o8#@W*    ::          
                     .:.   .::::o.  8WWWWWWWWWWWWWW@:    .&8*.      :&&:    :@WWWWWWWWWWW@o**&:oo:o8#W*    :o           
                    .::.   .::::o.  *WWWWWWWWWWWWW#.       :#@#8&&8#@&.      .#WWWWWWWWWW#:***:o::o8@*    :o            
                    .::    .:::o:.  .#WWWWWWWWWWW&           :*8###&:          8WWWWWWWWW*:ooo::::o8*    :*.            
                   ....    .:::o::.  .#WWWWWWWW8:               ...             *@WWWWWW#:o*o:::::::    .o:             
                  .....    .:::o::..   *#@W@#&:                                  .&@WWW8::o*o:o:::.    .o:              
                 . .&:     .:::ooo..     ...                                       .:*o:::o*o:::.:.   .oo               
                 . *@o     .::o:o::.                                                 ..:::o*o.::..    :o.               
                  :#W*     .::o:ooo..                                               ...::o**o.::..   ::.                
               . .&@W&  .. ..:oooo:o.                               ..            ....:::*&o:.o..   .:                  
                 o#@W8.... ..:ooooo::.                             ...          ....::::o&*o.:o.   .:                   
                :#WWW8::..  ..::ooo:::                            ....        .....:::::&&o:.oo.   :                    
               .8@WWW#o:..   ..o:ooo:o:     .                    ....        ....::::::*8*:.:*:.                        
               *@WWWW#*:..   ..:::::o:::   .....                ......     ....:::::::*8*:::*o:.                        
              :@WWWWW@&:..   ...o:o::o:::. .......            ...............::::::::o8*o:.o*:..                        
           . .8WWWWW@@8o..    ..:o.::oo:::..........         ..............:::::::::*8*o:.o*o:..                        
             o@WWWW@@@#o..    ...:o::::o::::.. ........   ................::::::..:&&*o:.:*oo:.                         
            .#WWWWW@@@#o..     ...:o.:o:oo:::::.   .......................:::...:*8&*oo::*o:o..                         
         .  *@WWWWW@@@#o..     ....:o::o::o:::ooo::.  .......................:o&8&*ooo:o**o::..                         
           .#WWWWWWW@@@*:..     ....:o:.:o::o:::o***oo:::................:o*&&&**ooo::o**o:o:..                         
        .  *@@WWWWWW@@@*:...     ....::o:.:oo:::oooooo***oooooo::::oooo***&***oooo::o***::o:..                          
          .#@@WWWWWWW##&o:..      .....:oo:::oo::ooooooooooooooooooooooo*o*ooooo:oo*&*o::o::..                          
          o@@@WWWWWW@#8*o:...     .......:ooooo**ooo::::::::::::::::::::oooooooo*&&*o:.:o:::..                          
          8@@WWWWWWW@#&*o::..      .......:::oo********ooooooooooooooooooooo**&&**o:..:o:.::.                           
         :@@WWWWWWWW#8*:.::...      ........::::ooooooooooooo:::::::::::ooo***oo::.::o:..::..                           
         *WWWWWWWWWW8.:..::...         ...:.::o::::::ooooooooooooooooooooooo:::::::::...:::..                           
      .. &WWWWWWWWWW&   ..:...           ...::o::::::::::::::::::::::::::::::::::::....::::.                            
      .. 8WWWWWWWWWWo.    .....            ...::::::::::::::::::::::::::::::::::.........:..                            
      o: &@WWWWWWWW@:.    ......              .....::::::::::::..........................:..                            
      :: *#@WWWWWWW# .     ......                  .......:...............    ..........:..                             
      .o.:##WWWWWWWo .     .......                                             .........:..                             
       :: o##@WWWW* .      .......                                             ........:..                              
       .o..:&8##8: :       ........                          *8*.              ........:..                              
        .o:..... .:.       .........                         *#8o              ..........                               
          oo:..:::          ........                        .oo::..            .........                                
           .:o::.           .........                       o*o*o:..           ........                                 
                             .........                     **:...             .........                                 
                              .........                    . .o:             .........                                  
                              ...........                    oo             ..........                                  
                              ............                   .&*.          .......:..                                   
                              . ............                  .&o       ........::..                                    
                              ..................         .         ... ........::...                                    
                               . ..................     :8&*&&&o:&*&**.............                                     
                               . ................... .. :*o****o:*o***............                                      
                               .. ......................   .:..:..:.  ...........                                       
                               .: ::.......................:.:o.o:.:............. ..                                    
                                : :&o:.....................:.:o:*o::..........:..:o.                                    
                                ..:&&&*:....................:.:o::o:........:::o&&:.                                    
                                ...&&&&&*o:.....................::.....:.::oo*&88&..                                    
                                .: *&&&&&&&*:.....:..............::::::::o**&&888*..                                    
                                .o *8&&&&&&&&*o.........::::.::::::::::o***&8888#*.                                     
                                 o *88888&&&&&&*:....:::::::::::::::::o&&&&888###o.                                     
                                 o.o88888888&&&&*o::::::::::::::::::o*&&&88######o.                                     
                                 o.o#888888888&&**oo:::::::::::::::*&8888##@@@@@#:.                                     
                                 o.*##########88&***oooo::::o:::o*&88##@@@@@@@@@#:.                                     
                                 o:*###@@@@@@@@@##8&*:.      .:&8##@@@@@@@W@WW@@@:.                                     
                                .o:*@@@@@@@@@WW@@@#&*         .&@@@WWWWWWWWWW@@@#o.                                     
                                .o:o@@@@@@@@W@@@@@#oo         .o#@@@WWWWWWWW@@@@8o:                                     
                                .oo:#@@@@@@WW@@@W@#.            8WWWWWWWWWWW@WW@&oo                                     
                                .*oo#W@W@WWWW@@@W@@:            8WWWWWWWWWWWWWW#&*o                                     
                                .ooo8WWWWWWWWWWW@WW&           .8WWWWWWWWWWWWWW8**o                                     
                                .::o*#WWWWWWWWWWWWW&           .8WWWWWWWWWWWWW#&*::                                     
                                .o:ooo*&8##@@@@@#8&o.          :*#@WWWWWWW@@#&&*o::                                     
                                 . ..:oo::oooo*oooo.            ooo***&***oooo:..::                                     
                                     .:ooo::::o::.               :ooooo:::ooo:..::                                      
                                   ....o*o.                            .  .o*o:::                                       
                                              ..                   .                                                    
                                                                                                                        
                                                                                                                        
```

<br/>

## **实现原理**

将图片转换为字符图片的原理非常简单；

众所周知，我们的图片实际上底层都是存储的每个像素RGB等信息的二进制二维数组；

因此，要把一个图片转换成字符图案，只需要**把每个像素点的颜色信息转换成某个字符**就可以了！

在实际实现时，可以使用图片中每个像素点的灰度信息来表示这个像素点；

常见的计算方法包括：平均值法、加权均值法、伽马校正法等；可以使用与伽马校正线性相似的数学公式进行计算，这也是 [MATLAB (opens new window)](https://www.mathworks.com/help/matlab/ref/rgb2gray.html)、 [Pillow (opens new window)](https://pillow.readthedocs.io/en/3.1.x/reference/Image.html)和 [OpenCV (opens new window)](https://github.com/opencv/opencv/blob/8c0b0714e76efef4a8ca2a7c410c60e55c5e9829/modules/imgproc/src/color.simd_helpers.hpp)使用的方法；

计算公式如下：

```
Y = 0.299*red + 0.587*green + 0.114*blue
```

计算完成后，根据不同的灰度等级将单个像素点转换为字符之后输出即可，非常简单！

下面来看实现；

<br/>

## **具体实现**

项目的目录结构如下：

```bash
$ tree
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── bin
    │   └── img2txt.rs
    └── lib.rs
```

项目非常简单，在 `lib.rs` 中实现所有逻辑，`bin/img2txt.rs` 中实现 cli 工具；

Cargo 配置如下：

```toml
[package]
name = "img2txt-rs"
version = "1.0.0"
edition = "2021"
description = "A cli to generate text image."
repository = "https://github.com/JasonkayZK/img2txt-rs"
homepage = "https://github.com/JasonkayZK/img2txt-rs"
license-file = "LICENSE"
keywords = ["cli", "image"]
categories = ["command-line-utilities", "multimedia::images"]

[dependencies]
image = "0.24.5"
clap = {version = "4.0.30", features = ["derive"]}

[[bin]]
bench = false
path = "src/bin/img2txt.rs"
name = "img2txt"
```

主要是使用了两个依赖：

-   **image**：进行图片处理；
-   **clap**：解析命令行参数；

下面分别来看实现；

<br/>

### **图片处理**

图片处理主要提供了下面几个功能：

-   加载并改变图片大小；
-   遍历各个像素点、计算其灰度值并转换为对应字符后输出；

加载并改变图片大小的实现代码如下：

src/lib.rs

```rust
/// Load image from path and reshape the image to TARGET_WIDTH
pub fn load_image(img_path: &str, target_width: u32) -> ImageResult<DynamicImage> {
    let img = image::open(img_path)?;
    Ok(resize_image(img, target_width))
}

pub fn resize_image(img: DynamicImage, target_width: u32) -> DynamicImage {
    let (src_width, src_height) = img.dimensions();
    let target_height = get_target_height(src_width, src_height, target_width);
    img.resize(target_width, target_height, FilterType::CatmullRom)
}

/// Calculate the target height of the reshaped image
#[inline]
fn get_target_height(src_width: u32, src_height: u32, target_width: u32) -> u32 {
    let mut target_height = src_height;
    if target_width < src_width {
        // Image is bigger than target, resize to a smaller size
        target_height =
            (target_height as f64 / (src_width as f64 / target_width as f64)).round() as u32;
    }
    target_height
}
```

`load_image` 方法通过 `image::open` 加载图片，随后通过 `resize_image` 将图片转为指定宽度的图片；

在 `resize_image` 函数中，调用了 `get_target_height` 方法，**等比例的计算** resize 之后应当具有的 height；

随后直接调用 `img.resize(target_width, target_height, FilterType::CatmullRom)` 返回即可！

>   **转换图片大小时，不可避免的会重新计算各个像素点，本文中使用的是 CatmullRom 方法；**

<br/>

下面重点来看将像素点转换为字符并输出的逻辑：

src/lib.rs

```rust
const PIXEL_CHAR_ARRAY: [char; 10] = ['W', '@', '#', '8', '&', '*', 'o', ':', '.', ' '];

pub fn print_image(img: DynamicImage) {
    let (width, height) = img.dimensions();
    for i in 0..height {
        for j in 0..width {
            let rgb = img.get_pixel(j, i);
            let rgb = rgb.channels();
            let (red, green, blue) = (rgb[0], rgb[1], rgb[2]);
            print!("{}", PIXEL_CHAR_ARRAY[calculate_index(red, green, blue)]);
        }
        println!();
    }
}

#[inline]
fn calculate_index(r: u8, g: u8, b: u8) -> usize {
    let grayscale = 0.2126 * r as f64 + 0.7152 * g as f64 + 0.0722 * b as f64;
    let index = grayscale / ((255 / PIXEL_CHAR_ARRAY.len()) as f64 + 0.5);
    index.floor() as usize
}
```

首先，我们定义了灰度等级对应的字符的数组 `PIXEL_CHAR_ARRAY`；

`print_image` 方法逐行的遍历像素点，并使用 `get_pixel(w, h).channels()` 获取像素点的 RGB 信息；

随后调用 `calculate_index` 方法计算当前像素点在字符数组中的索引 `[0~PIXEL_CHAR_ARRAY.len()-1]`；

计算方法也是非常简单：**计算当前灰度 grayscale 占 `0~255` 的比例，然后等比例的去找对应在字符数组中的 index 即可；**

最后通过 `print!` 输出各个字符即可～

<br/>

### **命令行工具**

通过 Rust 的 clap crate 可以很方便的开发命令行工具；

实现代码如下：

src/bin/img2txt.rs

```rust
const DEFAULT_TARGET_WIDTH: u32 = 120;

#[derive(Debug, Parser)]
#[clap(author, version, about, long_about = None)]
struct Args {
    img_path: String,
    #[clap(short, long, value_parser, default_value_t = DEFAULT_TARGET_WIDTH)]
    size: u32,
}

fn main() {
    let args = Args::parse();
    let img = load_image(&args.img_path, args.size).unwrap();
    print_image(img);
}
```

首先定义了命令行参数 Args，包括两个参数：

-   `img_path`：图片所在的路径，必须指定；
-   `size`：图片的大小，默认为 `DEFAULT_TARGET_WIDTH`，120个字符的宽度；

在 main 函数中，首先通过 `Args::parse()` 解析命令行参数；

随后通过前文中的 `load_image` 加载并格式化图片，最后通过 `print_image` 打印图片即可！

<br/>

## **工具测试**

可以通过命令行测试一下我们开发的工具：

```bash
$ cargo run -- ./examples/example.jpg

                                                                                                                        
                                                                                     o#8.                               
                                                                                     8o&&                               
                                                                   .                :8:o#.                              
                                                             .o&8#@@##8*o.          :8:o#:                              
                                                           o#@@########@@@#8&*:      #o:#:.o&8&:                        
                                                         o#@#8888888888888#@@W@8&    *#o###8&*&@:                       
                                                       o8@#888888888888888888#@WW8    8@#&o::::#o                       
                                                      &@#8888888888888888888888#@W#.  .@#o:::o&#.                       
                                                    .#@88888888888888888888888888@W8  8&*##8###:                        
                                                    #@8888888888888888888888888888#W#&8  .ooo:                          
                                                   8@888888888888888888888888888888#W@.                                 
                                                  o@8888888&:.. ..o&88888888888888888@8                                 
                                                  ##88888&:         o88888888888888888@#o.                              
                                                 :@88888&        .   o88888888888888888@W@&:                            
                                                 *#88888.  :&8o.8#8o  &88888888888888888#@W@&                           
                                                 #88888o  o#&*##8o&#o o8888888888888888888#@W#o                         
                                                .@88888. o#o  :*.  &#:.888888888888888888888#WW#*                       
                                                o#8888*  **         &: &8888888888888888888888@WW8                      
                                                *#8888*o*88####@@###8*o888888888888888888888888#@W8                     
                                                *#8#@@@@@###8888888##@@@@#8888888888888888888888#@W8                    
                                                o@@@#8888888888888888888#@@@#88888888888888888888#@W#                   
                                              .&##8888888888888888888888888#@@#8888888888888888888#W@                   
                                             *##88888888888888888888888888888#@@@88888888888888888#@Wo                  
                                           o##888888888888888888888888888888888#@@@8888888888888888@W8                  
                                          &@8888888888888888888888888888888888888@@@@88888888888888#W#                  
                                        .8#888888888888888888888888888888888888#@#&&#@#888888888888#W#                  
                                       .####@@@@@###888888888888888888888888##@#&&&&&8@#88888888888#W#                  
                                      :@W@@@@#8###@@@@@@@###8888888#####@@@@#8&oo*&&&&8@#8888888888#@#                  
                                     o@@##8#@oooo***&8888##@@@@@@@@@##88&***o:oo*****&*8@#888888888#@#                  
                                    :@#8888@8.**o***ooooo:o8&o:oo::o:....::o:::oo****&**8@#8888888##W#                  
                                    8#8888#@::*****oooooo:o&*::::::::...::oo:::oo**&&&&&&8@#8888888#W*                  
                                    ##8888## o**oooooo**o::o*:..:::::..::::o::ooo*****&&&&#@#88888#@@.                  
                                    ##88#8@& *&**ooo&####*o:o:..:::::.:::::o::ooo*****&&&&8#@88888#W&                   
                                    &W#88#@: &&oooo8@@@@@@8o::...::::.::::oooo*&8&*o***&&&&&#@888#@@.                   
                                    .#W@##@ :8*ooo&@##WWW@@&:....::::.:::ooo*8@WW@#&***&&&&88@#88#W*                    
                                      &@WW8.&&ooo*8##8@W@W##:.....::::::ooo*#WWWW@@@8**&&&&&&8@##W8                     
            :                          :&@#8&oooo&##@#W@@W@#*.....:::::oooo8WWW@@W@#@&*&&&&&*&#@W#                      
           *8                             *&**&**&##@@@@WW@#&.....:::::o::*@@@W@@W@#@@&&&&&8*&8@8.                      
           *.o                           .&&8&*oo*##@@@@WW@8&.....:::::o::&@@@W@WW8#@@&&&&&8&88o                        
            &8                           o&&&ooooo##@@@@@W#8*.....:::::o:o8#W@@WWWW#@#&&888&8##.                        
            o                            *88*ooooo8@@@@@@@8#o...::::::oo:o8#W@@@WWW#@8**&8#8&##:                        
             .......                     *88&**oooo8@@@@@88&:...::::oooo:o8##W@@@W@#@*****8#8##*                        
            ......   .                   *8&*******o&888&*o::..::::ooooooo&8#@@W@@@@&*****8@#8#8.                       
            ... .... ..                  *&&o*****&**oo:::.....::::ooooooooo*&#@@@#&*****&8#####o                       
            ..  ..:. ...                 *&*ooo******oo:....:..:oooooo*ooo:o::o**&**&&&&&88###88&                       
           .... .::.  ...                o&*o::oo*ooo::.......:oo******ooo::::::o**&&&&&&&&8#888*                       
           ...  ..:. ....                o**o::ooo:::........o**&***&&&*oo:::::::oo**&&&*&&8##88:                       
            ..   .....  .                o&*::::::...........:*8@&*&@@#*oo:::::::::o******&&#888:                       
            ...  .....  .                :&*::::..:...........:o&&&88&*ooo::::::::::o*oo***&##88*                       
            ......::.....                .&*:ooo:::............:o&8&o::::ooo::::::::o***o***8888*                       
            ......::.....                 *o:oo:::............:::&&o::::::ooo::::::::ooooo**8888*                       
             ... ..... ..                 oo:oo::............::oo&&oo:::ooo::o:::::::ooo**o*&888*                       
              .. ..  ...                   ::o::............:::o*&&*ooo:::ooo:::::::oo***oo*&#88o                       
               ......      &.              :::....... ....::::oo*&&*ooooo:::oo::::oooooooooo*888:                       
                     .o   oo .             :....::........:::oo**&&**ooooooo::::::ooooo::ooo*&&&.                       
                     8#8.  .#o              .:::.........:::oo*&&&&&*oooooooo::::ooo:::::ooo*&&*                        
                    .8 &#. :o               .:....:.....::::o*&&&&&&&&*oooo::::::ooo:::::ooo***.                        
                    .#  &#                   ...::::...::::oo*******&&*oooooo:::ooo::::::ooo**o                         
                     #:  8@.                 .:::.:....::::oooooo*******ooooo::ooooo:::::ooooo.                         
                     &&   8@*.                .:.:..::.:::::oooooooooo***oooooooooooo:::::ooo                           
                     .@    *#W&                ::.:::::::::::::ooooooooooooooooooooooooooooo.                           
                     8#      o@&                ::::::::::::::::ooooooooooooooooooooooooooo.                            
                    o@        oW8:               :::::::::::::::oooooooooooooooooooooooooo:                             
                    .#&       .@#@8:              .o::::::::oooooooooooooooooooooooooooo:                               
                     .##.     8#88#@#*.          :8@&::::oooooooooooooooooooooooooooooo:                                
                       &@:   :@88888#@@8:       :@@@@#*:oooooooooooooooooooooooooooooo.                                 
                        &@.  8#88888888@@8:    :@@@#8#@@&oooooooooooooooooooooooooo*&:                                  
                         8@.o@88888888888#@#&. #@#@8888#@#&*oooooooooooooooooo***&&8@@*                                 
                          @@@@#888888888888#@@#@#@#8888888#@#&********&&&88##88888888#W#:                               
                          .*o&@W#8888888888888@@#@88888888888#######@@@@@@##@8888888888@W8.                             
                              .*#W@#8888888888@#@#888888888888888888@#######@88888888888#@@8*.                          
                                 o#@@##8888888@#@8888888888888888888@#######@8888888888888#@W@&.                        
                                   :&@W@#8888#@@@888888888888888888#@#######@#888888888888888#@W8:                      
                                      o8@W@#8@#@#888888888888888888@########@#888888#8888888888#@W8.                    
                                        .*#@@@#@#888888888888888888@########@@888888@@#8888888888#W#                    
                                           :@@@@888888888888888888#@#########@8888888#W#88888888888W:                   
                                            ##@@888888888888888888@@#########@#88888888@@#888888888W:                   
                                            @#@@888888888888888888@##########@@888888888#@@8888888#@.                   
                                            @@@@@@####888888888888@###########@@888888888#@8888888W*                    
                                           *@#@@##@@@@@@@##8888888@#####@@@####@#8888888#@#888888@@.                    
                                          *#: *@#########@@@@##88#@###@#o:&@####@@88888##W888888#W&                     
                                         .@:  .@#############@@@@@@##@&.   &@####@@@###@@@888888@@                      
                                         *8   .#@################@##@*  .. .8@#####@@@@@W#88888#W*                      
                                         &&   .#@##################@o  . .. :@@########@@888888@#                       
                                         && . :@##################@&  .  ... o@#######@@@@@@@@#Wo                       
                                         &&   8@##################@:     ...  8@######@W8oo*&#W8                        
                                         o@. &@###################@o   .....  :@######W&     :@.                        
                                          #8&@####################@8  ....... .@@#####Wo    .#*                         
                                          #W@######################@o ....    :@######@8    o@                          
                                         .@########################@@o  ..   :#@######@Wo   .#@#*                       
                                         :@#########################@@&:   .*@@#######@@8     :o@:                      
                                         o@###########################@@#88#W@########@@#       &&                      
                                         o@#############################@@@@###########@W*      8&                      
                                         :W###########################################@@@@@8*o*#@:                      
                                          &@@@@@@@@@@@@@@@@@@@@@@@###########@@@@@@WWW@@*.o8888o                        
                                           .::::o**&&&&&&88####@@@@@@@@@@@@@@@@@##8&*:.                                 
                                                                   ..........                                           
                                                                                                                        
                                                                                                                        
```

指定图片的大小：

```bash
cargo run -- ./examples/example.jpg -s 60

                                                            
                                                            
                                          :&.               
                               :o**:.     ***               
                            .*8######88*. o&&*&&            
                           *#8888888888@@: 88oo8.           
                          &#888888888888##ooo**:            
                         *#88&*oo&88888888@:                
                         #88*     o88888888#&:              
                        o88& o**&&.&88888888#@&.            
                        &88:.*.:.:*o8888888888#@*           
                        &8#&88888888#88888888888@&          
                       .8#8888888888###8888888888W*         
                     .&8888888888888888###8888888#8         
                    :8888888888888888888###888888##         
                   o@#########8888#####8&&&#88888##         
                  o@##&o**&&*88&&&**oooo***&#8888##         
                  ##8#:**ooo:oo..:..:::oo*&&&#888#&         
                  ###&:*o*###*:.::.::oo*&**&&8#88@:         
                  :#@**oo8#@W8:..:::oo8W@#**&&8#@&          
     .:             o&***#@@W#o..::::&WW@@#&&&&#&           
     .o             .&*o*#@@W#o..::::#@@W##&&&8*            
      .             :8*oo8@@@8:.::::o#@@W@8*&8#&            
      .....         :&****&&o:..::ooo*8@@#***8#8.           
      . .. .        :&oo**o:...:o***o::o**&&&8#8:           
      . .....       .*::::....:&&&8&o::::o***&#8.           
      . .....       .*:::......:&&*oo:::::o***88:           
      . ....         ooo:......:**::ooo:::ooo*88:           
       ..    .       .:.......:o**oo:oo::ooooo88.           
          :* :o       ::.....:o*&&*ooo:::oo:oo&&            
          o:*.        ...:..::*&*&&*oo::oo:::o*:            
          :::&:        :::.:::oooo**oooooo::oo:             
          :o .&*        ::::::::ooooooooooooo:              
          *:   &8:       ::::::ooooooooooooo:               
           &o  88#8*    o#8o:oooooooooooooo.                
            &o*#888##*.:@#8#8*oooooooooo*&8.                
             &8##88888#@@8888#8&&&888##888##*               
               .&###888@#88888888#@####88888##&:            
                 .o8###@#88888888######8888888##8:          
                    .*@@888888888#####@888##88888#.         
                      #@888888888#######888##8888#.         
                     .#@#####8888######@8888##88#&          
                     &.&##########@&:&@#@###@888@.          
                    :o *@########@*   8###@@@88#&           
                    :o 8#########8  . .####@8&##.           
                    .&&@#########8  .. &@##8  oo            
                    .@@##########@*   .8####. **.           
                    .#############@8o*#@###@o  :&           
                    .@##############@@#####@#o:o&           
                     o&&88888############8&*.:o:            
                                  ....                      
                                                            

```

<br/>

## **安装使用**

开发完成后，我们就可以通过 `cargo publish` 将我们的工具发布到 [crates.io](https://crates.io/)；

随后直接使用 Cargo 命令安装即可：

```bash
$ cargo install img2txt-rs
```

安装完成后，可以直接使用：

```bash
$ img2txt examples/example2.jpg -s 60

:......::::**oooo:    .&8*88#o            :ooooooooooooooooo
:::::ooooooooooo:    :8*. :8*      .       :oooooooooooooooo
oooooooooooooooo    :8:                     :ooooooooooooooo
ooooooooooooooo.   .&:              .     .  :oooooooooooooo
oooooooooooooo:    &:               .. .   .  ooooooooooo*oo
oooooooooooooo    o:     .      .    . ..  .  .ooooooooooooo
ooooooooooooo:    o      .    . .    .. :   .  :oooooooooooo
ooooooooooooo.   .:   .  .  . . .     . ..  .. .oooooooooooo
oooooooooooo:    :.   .  .  . : .    .:..:  .. ..oooooooo*oo
oooooooooooo:    :   ..  .  . : ..   ..: :. ......ooooooo*oo
oooooooooooo.    :   .. .. .: ....   . : .: ... o.:oooooo*oo
oooooooooooo     .   .. .:. . :...   .....: .::.:o.:oooo&&8#
ooooooooooo:     .   .. ::  : ...:   .... :  :.::ooo&88#8#@#
ooooooooooo:     .   .  :.  : ...:.  .::o:o: o.o:88#@###88##
ooooooooooo:    ..  .. .:. .: .....  :888888.::&:88#####88##
oooooooooo:.    :.  .. .:. .:o*o...  :*o#8**.::&&88###8888##
oooooooooo. .   :.. .. .:.o&88#&..... o&8#8o.:.*#88###88&8##
oooooooooo ..  .o.. .. .&8&8**&.      *&&*o: ..:888###88&&##
oooooooooo . ..:o.. .. :&o:&&88.      .o..:.....*&&8###&****
oooooooooo.:...oo.. .....*888&&:       .......::o&&&88*::...
ooooooooo&*:..:oo.. :... :&o:.:.        .......o:oo:........
ooooooo*&8&o::::... .: .  ::..:          ....  :o.........::
oo*&&88@#888*::::.. .: . . ....               .:::::..:::ooo
888888888#88ooo:... .:.........               :o:::ooooooooo
8888888&8##* .:o.:...:.........              .&*o::oo*o:::::
88888888888:   .::....:. .....              .&&***o*****:o:o
8888888888*:    :::...::                   .**oooo***&**o:::
8888&8##8&::    .:::..:o.                .o*ooooooo*o***o:::
888888##8o::.   .:::::::o:.            .o*ooooooooo*o*oooooo
&&&#88*:oo:::    :::oo::o88*:.     ..:o*ooooooooooooooo:oooo
&&*88:..o::::.  .:**o&o::*&*&&**o****ooooooooooooooooooooooo
o::o.   ::::oo:ooo*8:**o::**oooooooooooooooooooooooooooooooo
:..:   .ooooooooooo*o:ooo:o***oooooooooooooooooooooooooooooo
. .o::oooooooooooooooooooo*******ooooooooooooooooooooooooooo
:ooo*ooooooooooooooooooooo*&&*****oooooooooooooooooooooooooo
*oooooooooooooooooooooooooo*****oooooooooooooooooooooooooooo
ooooooooooooooooooooooooooo**o**oooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
```

<br/>

## **总结**

不到 200 行代码我们就实现了我们的功能！并且熟悉了 Rust 之后，开发效率其实是非常高的；

<br/>

# **附录**

源代码：

-   https://github.com/JasonkayZK/img2txt-rs

参考文章：

-   https://www.wdbyte.com/java/char-image.html

<br/>
