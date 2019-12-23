<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!--部门数据-->
      <el-col :span="3">
        <div class="head-container">
          <el-input
            v-model="deptName"
            placeholder="请输入部门名称"
            clearable
            size="small"
            prefix-icon="el-icon-search"
            style="margin-bottom: 20px"
          />
        </div>
        <div class="head-container">
          <el-tree
            :data="deptOptions"
            :props="defaultProps"
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            ref="tree"
            default-expand-all
            @node-click="handleNodeClick"
          />
        </div>
      </el-col>
      <!--用户数据-->
      <el-col :span="20">
        <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="68px">
          <el-form-item label="用户名称" prop="userName">
            <el-input
              v-model="queryParams.userName"
              placeholder="请输入用户名称"
              clearable
              size="small"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item v-if="isDistribution || toSend" prop="userId" label="用户id">
            <el-input
              v-model="queryParams.userId"
              placeholder="请输入用户id"
              clearable
              size="small"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item v-if="isDistribution && !toSend" label="发放情况" prop="isSend">
            <el-select v-model="queryParams.isSend" placeholder="请选择">
              <el-option label="全部" :value="undefined"></el-option>
              <el-option label="已发放" value="2"></el-option>
              <el-option label="未发放" value="1"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="isDistribution || toSend" label="月份查询" prop="wagesDate">
            <el-select v-model="queryParams.wagesDate" placeholder="请选择">
              <el-option label="全部月份" :value="null"></el-option>
              <el-option v-for="(item,index) in monthList" :label="item" :value="item" :key="index"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="warning"
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
              v-hasPermi="['system:user:export']"
            >导出
            </el-button>
          </el-col>
          <el-col :span="2">
            <el-button
              type="info"
              icon="el-icon-view"
              size="mini"
              @click="toDistribution"
            >{{wagesDM}}
            </el-button>
          </el-col>
          <el-col :span="2" offset="18">
            <el-button
              type="primary"
              size="mini"
              @click="toSendWages"
            >发放工资
            </el-button>
          </el-col>
        </el-row>
        <div v-if="!isDistribution && !toSend">
          <el-table key="1" v-loading="loading" :data="userList"
                    :row-class-name="tableRowClassName">
            <el-table-column label="用户编号" align="center" prop="userId"/>
            <el-table-column label="用户名称" align="center" prop="userName"/>
            <el-table-column label="用户昵称" align="center" prop="nickName"/>
            <el-table-column label="部门" align="center" prop="dept.deptName"/>
            <el-table-column label="状态" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.status === '1'">
                  停用
                </span>
                <span v-else>
                  正常
                </span>
              </template>
            </el-table-column>

            <el-table-column label="手机号码" align="center" prop="phonenumber" width="120"/>
            <el-table-column label="银行卡号" align="center" prop="cardNumber" width="200"/>
            <el-table-column label="工资" align="center" width="120">
              <el-table-column align="center" label="基本工资" width="120">
                <template slot-scope="scope">
                  <el-input v-if="editKey === scope.row.userId" v-model="scope.row.basicWages"/>
                  <span v-else>{{scope.row.basicWages}}</span>
                </template>
              </el-table-column>
              <el-table-column align="center" prop="otherWages" label="其他工资" width="120">
                <template slot-scope="scope">
                  <el-input v-if="editKey === scope.row.userId" v-model="scope.row.otherWages"/>
                  <span v-else>{{scope.row.otherWages}}</span>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="100"
              class-name="small-padding fixed-width"
            >
              <template slot-scope="scope">
                <el-button
                  v-if="showEdit || editKey !== scope.row.userId"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:user:edit']"
                >修改
                </el-button>
                <el-button
                  v-if="!showEdit && editKey === scope.row.userId"
                  size="mini"
                  type="text"
                  icon="el-icon-success"
                  @click="handleSave(scope.row)"
                  v-hasPermi="['system:user:edit']"
                >
                </el-button>
                <el-button
                  v-if="!showEdit && editKey === scope.row.userId"
                  size="mini"
                  type="text"
                  icon="el-icon-error"
                  @click="handleCancel(scope.row)"
                  v-hasPermi="['system:user:edit']"
                >
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
        <div v-if="isDistribution && !toSend">
          <el-table key="2" v-loading="loading" :data="wagesList" @selection-change="handleSelectionChange"
                    :row-class-name="tableRowClassName">
            <el-table-column type="selection" :selectable='checkboxT' width="40" align="center"/>
            <el-table-column label="发放记录id" align="center" prop="recordId"/>
            <el-table-column label="用户id" align="center" prop="userId"/>
            <el-table-column label="用户名称" align="center" prop="userName"/>
            <el-table-column label="发放金额" align="center" prop="totalWages"/>
            <el-table-column label="银行卡卡号" width="200" align="center" prop="cardNumber"/>
            <el-table-column label="工资日期" align="center" prop="wagesDate"/>
            <el-table-column label="发放日期" align="center" prop="releaseDate"/>

            <el-table-column label="是否发放" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.isSend === 1">未发放</span>
                <span v-else>已发放</span>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="ids.length>0" @click="sendWages" style="float: left;margin-top: 20px" type="danger"><i
            class="el-icon-warning"></i>一键发放已选择
          </el-button>
          <pagination
            style="float: right"
            v-show="total2>0"
            :total="total2"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getListWages"
          />
        </div>
        <div v-if="toSend">
          <el-table key="3" v-loading="loading" :data="wagesList" @selection-change="handleSelectionChange"
                    :row-class-name="tableRowClassName">
            <el-table-column type="selection" :selectable='checkboxT' width="40" align="center"/>
            <el-table-column label="发放记录id" align="center" prop="recordId"/>
            <el-table-column label="用户id" align="center" prop="userId"/>
            <el-table-column label="用户名称" align="center" prop="userName"/>
            <el-table-column label="发放金额" align="center" prop="totalWages"/>
            <el-table-column label="银行卡卡号" align="center" width="200" prop="cardNumber"/>
            <el-table-column label="日期" align="center" prop="wagesDate"/>
            <el-table-column label="发放状态" align="center">
              <span>没发放</span>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template slot-scope="scope">
                <a style="color: blue" @click="sendOneWages(scope.row.recordId)">下发工资</a>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="ids.length>0" @click="sendWages" style="float: left;margin-top: 20px" type="danger"><i
            class="el-icon-warning"></i>一键发放已选择
          </el-button>
          <pagination
            style="float: right"
            v-show="total2>0"
            :total="total2"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getListWages"
          />
        </div>
      </el-col>
    </el-row>

  </div>
</template>
<style>
  .el-table .success-row {
    background: #f0f9eb;
  }
</style>
<script>
  import {
    listUser,
    getUser,
    delUser,
    addUser,
    updateUser,
    exportUser,
    resetUserPwd,
    changeUserStatus,
    getListUser
  } from '@/api/system/user'
  import { treeselect } from '@/api/system/dept'
  import { listPost } from '@/api/system/post'
  import { listRole } from '@/api/system/role'
  import { listWages, monthList, sendWagesByIds, wagesEdit,getListWages } from '@/api/schedule/wages'
  import Treeselect from '@riophae/vue-treeselect'
  import '@riophae/vue-treeselect/dist/vue-treeselect.css'
  import {jsonExport} from '../../../utils/exportExcel'

  export default {
    components: { Treeselect },
    data() {
      return {
        total2:0,
        editKey: undefined,
        toSend: false,
        wagesList: [],
        //月份情况
        monthList: [],
        //工资情况
        wageSituation: '',
        //显示工资发放情况
        isDistribution: false,
        wagesDM: '工资发放记录',
        //是否点击修改
        showEdit: true,
        //总金额
        totalWages: 0,

        // 遮罩层
        loading: true,
        // 选中数组
        ids: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 总条数
        total: 0,
        // 用户表格数据
        userList: null,
        // 弹出层标题
        title: '',
        // 部门树选项
        deptOptions: undefined,
        // 是否显示弹出层
        open: false,
        // 部门名称
        deptName: undefined,
        // 默认密码
        initPassword: undefined,
        // 日期范围
        dateRange: [],
        // 状态数据字典
        statusOptions: [],
        // 性别状态字典
        sexOptions: [],
        // 岗位选项
        postOptions: [],
        // 角色选项
        roleOptions: [],
        // 表单参数
        form: {},
        defaultProps: {
          children: 'children',
          label: 'label'
        },
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
          userId: undefined,
          userName: undefined,
          isSend: undefined,
          wagesDate: undefined
        },
        // 表单校验
        rules: {
          userName: [
            { required: true, message: '用户名称不能为空', trigger: 'blur' }
          ],
          nickName: [
            { required: true, message: '用户昵称不能为空', trigger: 'blur' }
          ],
          deptId: [
            { required: true, message: '归属部门不能为空', trigger: 'blur' }
          ],
          password: [
            { required: true, message: '用户密码不能为空', trigger: 'blur' }
          ],
          email: [
            {
              type: 'email',
              message: '\'请输入正确的邮箱地址',
              trigger: ['blur', 'change']
            }
          ],
          phonenumber: [
            {
              pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
              message: '请输入正确的手机号码',
              trigger: 'blur'
            }
          ]
        }
      }
    },
    watch: {
      // 根据名称筛选部门树
      deptName(val) {
        this.$refs.tree.filter(val)
      }
    },
    created() {
      this.getList()
      this.getTreeselect()
      this.getDicts('sys_normal_disable').then(response => {
        this.statusOptions = response.data
      })
      this.getDicts('sys_user_sex').then(response => {
        this.sexOptions = response.data
      })
      this.getConfigKey('sys.user.initPassword').then(response => {
        this.initPassword = response.data
      })
      monthList().then(res => {
        this.monthList = res.data
      })
    },
    methods: {
      //单个工资发放
      sendOneWages(index) {
        sendWagesByIds([index]).then(res => {
          this.$notify({
            title: '工资发放成功，发放记录分别为',
            message: [index],
            type: 'success'
          })
          this.getListWages()
        })
      },
      //跳转到工资table
      toSendWages() {
        this.toSend = true
        this.queryParams.isSend = 1
        this.getListWages()
      },
      //批量发放工资
      sendWages() {
        sendWagesByIds([...this.ids]).then(res => {
          this.$notify({
            title: '工资发放成功，发放记录分别为',
            message: [...this.ids],
            type: 'success'
          })
          this.getListWages()
        })
      },
      //判断多选框是否可选
      checkboxT(row) {
        if (row.isSend === 1) {
          return true
        }
        return false
      },
      //获取工资记录，包括没有发放的
      getListWages() {
        this.loading = true
        listWages(this.addDateRange(this.queryParams, this.dateRange)).then(res => {
          this.total2 = res.total
          this.wagesList = res.rows
          this.loading = false
        })
      },
      //员工工资情况和工资发放记录切换
      toDistribution() {
        this.total = 0
        this.toSend = false
        this.resetQuery()
        this.queryParams.deptId = ''
        this.queryParams.isSend = undefined
        if (this.isDistribution) {
          this.isDistribution = false
          this.wagesDM = '工资发放记录'
          this.getList()
        } else {
          this.getListWages()
          this.isDistribution = true
          this.wagesDM = '工资情况'
        }
      },
      /** 搜索按钮操作 */
      handleQuery() {
        if (this.toSend) {
          this.queryParams.page = 1
          this.getListWages()
        } else if (this.isDistribution) {
          this.queryParams.page = 1
          this.getListWages()
        } else {
          this.queryParams.page = 1
          this.getList()
        }

      },
      //table表格样式
      tableRowClassName({ row, rowIndex }) {
        if (rowIndex % 2 === 0) {
          return 'success-row'
        }
        return ''
      },

      /** 查询用户列表 */
      getList() {
        this.loading = true
        listUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
            this.userList = response.rows
            this.total = response.total
            this.loading = false
          }
        )
      },
      /** 查询部门下拉树结构 */
      getTreeselect() {
        treeselect().then(response => {
          this.deptOptions = response.data
        })
      },
      // 筛选节点
      filterNode(value, data) {
        if (!value) return true
        return data.label.indexOf(value) !== -1
      },
      // 节点单击事件
      handleNodeClick(data) {
        this.queryParams.deptId = data.id
        if (this.isDistribution) {
          this.queryParams.page = 1
          this.getListWages()
        } else {
          this.queryParams.page = 1
          this.getList()
        }
      },
      /** 查询岗位列表 */
      getPosts() {
        listPost().then(response => {
          this.postOptions = response.rows
        })
      },
      /** 查询角色列表 */
      getRoles() {
        listRole().then(response => {
          this.roleOptions = response.rows
        })
      },
      // 用户状态修改
      handleStatusChange(row) {
        let text = row.status === '0' ? '启用' : '停用'
        this.$confirm('确认要"' + text + '""' + row.userName + '"用户吗?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(function() {
          return changeUserStatus(row.userId, row.status)
        }).then(() => {
          this.msgSuccess(text + '成功')
        }).catch(function() {
          row.status = row.status === '0' ? '1' : '0'
        })
      },
      // 取消按钮
      cancel() {
        this.open = false
        this.reset()
      },
      // 表单重置
      reset() {
        this.form = {
          userId: undefined,
          deptId: 100,
          userName: undefined,
          nickName: undefined,
          password: undefined,
          phonenumber: undefined,
          email: undefined,
          sex: undefined,
          status: '0',
          remark: undefined,
          postIds: [],
          roleIds: []
        }
        this.resetForm('form')
      },

      /** 重置按钮操作 */
      resetQuery() {
        this.dateRange = []
        this.resetForm('queryForm')
        this.handleQuery()
      },
      // 多选框选中数据
      handleSelectionChange(selection) {
        this.ids = selection.map(item => item.recordId)
        this.single = selection.length != 1
        this.multiple = !selection.length
      },
      /** 新增按钮操作 */
      handleAdd() {
        this.reset()
        this.getTreeselect()
        this.getPosts()
        this.getRoles()
        this.open = true
        this.title = '添加用户'
        this.form.password = this.initPassword
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.editKey = row.userId
        this.showEdit = false
      },
      handleSave(row) {
        window.console.log(row)
        wagesEdit(row).then(res => {
          this.$notify({
            title: res.msg,
            type: 'success'
          })
          this.editKey = undefined
          this.showEdit = true
        })

      },
      //取消按钮
      handleCancel() {
        this.editKey = undefined
        this.showEdit = true
      },
      /** 重置密码按钮操作 */
      handleResetPwd(row) {
        this.$prompt('请输入"' + row.userName + '"的新密码', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        }).then(({ value }) => {
          resetUserPwd(row.userId, value).then(response => {
            if (response.code === 200) {
              this.msgSuccess('修改成功，新密码是：' + value)
            } else {
              this.msgError(response.msg)
            }
          })
        }).catch(() => {
        })
      },
      /** 提交按钮 */
      submitForm: function() {
        this.$refs['form'].validate(valid => {
          if (valid) {
            if (this.form.userId != undefined) {
              updateUser(this.form).then(response => {
                if (response.code === 200) {
                  this.msgSuccess('修改成功')
                  this.open = false
                  this.getList()
                } else {
                  this.msgError(response.msg)
                }
              })
            } else {
              addUser(this.form).then(response => {
                if (response.code === 200) {
                  this.msgSuccess('新增成功')
                  this.open = false
                  this.getList()
                } else {
                  this.msgError(response.msg)
                }
              })
            }
          }
        })
      },
      /** 删除按钮操作 */
      handleDelete(row) {
        const userIds = row.userId || this.ids
        this.$confirm('是否确认删除用户编号为"' + userIds + '"的数据项?', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(function() {
          return delUser(userIds)
        }).then(() => {
          this.getList()
          this.msgSuccess('删除成功')
        }).catch(function() {
        })
      },
      /** 导出按钮操作 */
      handleExport() {
        if (!this.isDistribution && !this.toSend){
          getListUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
              jsonExport(response.data,"xls","员工列表"+new Date());
            }
          )
        }
        else{
          getListWages(this.addDateRange(this.queryParams, this.dateRange)).then(res => {
            jsonExport(res.data,"xls","工资发放记录"+new Date());
          })
        }
      }
    }
  }
</script>
